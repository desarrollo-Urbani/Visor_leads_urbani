"""
ai_normalizer.py - Normalizador con IA para CSVs de conversaciones (prueba1)
=============================================================================
Lee un CSV con transcripciones de chat en JSON, usa Ollama (llama3.2:latest)
para generar resúmenes ejecutivos, y produce un CSV normalizado con el esquema:
  nombre, email, telefono, renta, proyecto, observacion

Los leads procesados por IA quedan marcados con 🤖 al inicio de 'observacion'.

Uso:
    python ai_normalizer.py prueba1.csv
    python ai_normalizer.py prueba1.csv --output mi_salida.csv
"""

import os, sys, re, json, ast, subprocess, time, argparse
from typing import Tuple

import pandas as pd
import requests

# ─────────────────────────────────────────
# CONFIGURACIÓN
# ─────────────────────────────────────────
OLLAMA_URL   = "http://127.0.0.1:11434/api/generate"
OLLAMA_MODEL = "llama3.2:latest"
MAX_CONV_CHARS = 4500
TEMPERATURE    = 0.2
NUM_PREDICT    = 280
TIMEOUT        = (10, 300)
KEEP_ALIVE     = "20m"

EMAIL_RE = re.compile(r"[a-z0-9][\w.\-]*@[\w.\-]+\.\w+", re.IGNORECASE)
RUT_RE   = re.compile(r"\b(\d{1,2}\.?\d{3}\.?\d{3}|\d{7,8})-?([\dkK])\b")
PHONE_RE = re.compile(r"\b(56\d{9}|\d{8,9})\b")

MONEY_MIL_RE  = re.compile(r"\b(\d{2,4})\s*(mil)\b", re.IGNORECASE)
MONEY_MILL_RE = re.compile(r"\b(\d+(?:[.,]\d+)?)\s*(millones?|millón)\b", re.IGNORECASE)
MONEY_NUM_RE  = re.compile(r"\b(\d{1,3}(?:[.,]\d{3})+|\d{6,8})\b")
INCOME_CTX_RE = re.compile(r"\b(renta|sueldo|ingreso|líquido|liquido)\b", re.IGNORECASE)


# ─────────────────────────────────────────
# OLLAMA: arranque y warmup
# ─────────────────────────────────────────
def ensure_ollama(session: requests.Session):
    try:
        session.get("http://127.0.0.1:11434", timeout=3)
        return
    except Exception:
        print("⚠️  Ollama no responde. Intentando iniciar...")
        try:
            subprocess.Popen(["ollama", "serve"],
                             stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            for i in range(6):
                time.sleep(2)
                try:
                    session.get("http://127.0.0.1:11434", timeout=2)
                    print("🚀 Ollama iniciado.")
                    return
                except Exception:
                    print(f"   Esperando Ollama... ({i+1}/6)")
        except FileNotFoundError:
            print("❌ 'ollama' no encontrado. Instálalo en https://ollama.com")
            sys.exit(1)

def warmup(session: requests.Session):
    payload = {"model": OLLAMA_MODEL, "prompt": "OK\nFIN",
                "stream": False, "keep_alive": KEEP_ALIVE,
                "options": {"temperature": 0, "num_predict": 5, "stop": ["FIN"]}}
    try:
        session.post(OLLAMA_URL, json=payload, timeout=(5, 60))
        print(f"✅ Modelo {OLLAMA_MODEL} calentado y listo.")
    except Exception as e:
        print(f"⚠️  Warmup falló (se intentará igual): {e}")


# ─────────────────────────────────────────
# LECTURA DEL CSV "ENVUELTO" de prueba1
# ─────────────────────────────────────────
def read_csv_envuelto(path: str) -> pd.DataFrame:
    """
    prueba1.csv usa un formato donde toda la fila va dentro de comillas dobles
    externas, y las comillas internas del JSON están duplicadas (\"\" -> ").
    Este parser lo maneja correctamente.
    """
    with open(path, "r", encoding="utf-8", errors="replace") as f:
        content = f.read()

    # Elimina BOM si existe
    content = content.lstrip("\ufeff")
    lines = content.splitlines()
    if not lines:
        return pd.DataFrame()

    header_line = lines[0]
    header_cols = [c.strip() for c in header_line.split(",")]

    rows = []
    for raw in lines[1:]:
        if not raw.strip():
            continue

        # Cada fila viene envuelta en comillas dobles externas, desenvuelve
        inner = raw
        if inner.startswith('"') and inner.endswith('"'):
            inner = inner[1:-1]

        # Restaura comillas internas: "" -> "
        inner = inner.replace('""', '"')

        # Extrae fecha (primer campo antes de la primera coma que no está en JSON)
        # La transcripción es un array JSON que empieza con [{ ...
        # Estrategia: dividir por la primera coma encontrada ANTES del JSON
        json_start = inner.find(",[{")
        if json_start == -1:
            # Intenta sin coma
            json_start = inner.find("[{")
            if json_start == -1:
                continue

            prefix = inner[:json_start]
            rest   = inner[json_start:]
            prefix_parts = [p.strip() for p in prefix.split(",")]
            fecha        = prefix_parts[0] if len(prefix_parts) > 0 else ""
            nombre       = prefix_parts[1] if len(prefix_parts) > 1 else ""
            telefono_raw = prefix_parts[2] if len(prefix_parts) > 2 else ""
        else:
            prefix       = inner[:json_start]
            rest         = inner[json_start+1:]   # quita la coma
            prefix_parts = [p.strip() for p in prefix.split(",")]
            fecha        = prefix_parts[0] if len(prefix_parts) > 0 else ""
            nombre       = prefix_parts[1] if len(prefix_parts) > 1 else ""
            telefono_raw = prefix_parts[2] if len(prefix_parts) > 2 else ""

        # El resto: JSON de transcripción + campos finales
        # Busca dónde termina el JSON (último "]")
        last_bracket = rest.rfind("]")
        if last_bracket == -1:
            transcripcion_raw = rest
            suffix_str = ""
        else:
            transcripcion_raw = rest[:last_bracket+1]
            suffix_str = rest[last_bracket+1:].lstrip(",")

        # Campos finales: project_tag, tag_estado, cantidad_mensajes, outcome
        suffix_parts = [p.strip() for p in suffix_str.split(",")]
        project_tag      = suffix_parts[0] if len(suffix_parts) > 0 else ""
        tag_estado       = suffix_parts[1] if len(suffix_parts) > 1 else ""
        cantidad_mensajes= suffix_parts[2] if len(suffix_parts) > 2 else ""
        outcome          = suffix_parts[3] if len(suffix_parts) > 3 else ""

        rows.append({
            "fecha_creacion": fecha.strip('"').strip(),
            "nombre_usuario": nombre.strip('"').strip(),
            "telefono_raw":   telefono_raw.strip('"').strip(),
            "transcripcion":  transcripcion_raw.strip(),
            "project_tag":    project_tag.strip('"').strip(),
            "tag_estado":     tag_estado.strip('"').strip(),
            "cantidad_mensajes": cantidad_mensajes.strip('"').strip(),
            "outcome":        outcome.strip('"').strip(),
        })

    return pd.DataFrame(rows)


# ─────────────────────────────────────────
# PARSEO DE TRANSCRIPCIÓN JSON
# ─────────────────────────────────────────
def unescape_trans(s: str) -> str:
    if isinstance(s, str) and '""' in s and ('sender' in s or 'message' in s):
        return s.replace('""', '"')
    return s

def parse_chat(raw: str) -> str:
    """Convierte la transcripción JSON en texto limpio CLIENTE/BOT."""
    if not raw or not raw.strip():
        return ""
    raw = unescape_trans(raw.strip())

    try:
        data = json.loads(raw)
    except Exception:
        try:
            data = ast.literal_eval(raw)
        except Exception:
            # limpieza básica
            return re.sub(r'[{}\[\]]', '', raw).strip()

    if not isinstance(data, list):
        return re.sub(r'[{}\[\]]', '', str(data)).strip()

    lines = []
    for item in data:
        if not isinstance(item, dict):
            continue
        sender = str(item.get("sender") or item.get("from") or "BOT").strip().lower()
        msg    = str(item.get("message") or item.get("text") or "").strip()
        if not msg:
            continue
        role = "CLIENTE" if sender in ("user", "usuario", "cliente", "lead") else "BOT"
        lines.append(f"{role}: {msg}")

    text = "\n".join(lines)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()[:MAX_CONV_CHARS]


# ─────────────────────────────────────────
# EXTRACCIÓN DE CAMPOS SIN LLM
# ─────────────────────────────────────────
def only_client(conv: str) -> str:
    parts = [ln.replace("CLIENTE:", "").strip()
             for ln in conv.splitlines() if ln.startswith("CLIENTE:")]
    return " ".join(parts)

def extract_email(conv: str) -> str:
    m = EMAIL_RE.search(conv.lower())
    return m.group(0) if m else ""

def extract_phone(raw_phone: str, conv: str) -> str:
    # normalización chilena
    digits = re.sub(r'\D', '', raw_phone or "")
    if len(digits) == 11 and digits.startswith("56"):
        return f"+{digits}"
    if len(digits) == 9 and digits.startswith("9"):
        return f"+56{digits}"
    if len(digits) == 8:
        return f"+569{digits}"
    # intenta desde conv
    if not digits:
        m = PHONE_RE.search(conv)
        if m:
            d2 = m.group(0)
            if d2.startswith("56") and len(d2) == 11:
                return f"+{d2}"
    return f"+{digits}" if digits else ""

def extract_renta(conv: str) -> str:
    client = only_client(conv)
    if not INCOME_CTX_RE.search(client):
        return "0"
    m = MONEY_MILL_RE.search(client)
    if m:
        try:
            val = float(m.group(1).replace(",", ".")) * 1_000_000
            return str(int(val))
        except Exception:
            pass
    m = MONEY_MIL_RE.search(client)
    if m:
        try:
            return str(int(m.group(1)) * 1000)
        except Exception:
            pass
    m = MONEY_NUM_RE.search(client)
    if m:
        clean = re.sub(r'[^\d]', '', m.group(1))
        if clean:
            return clean
    return "0"

def clean_name(raw: str) -> str:
    # quita emojis y caracteres especiales, capitaliza
    name = re.sub(r'[^\w\s]', '', raw, flags=re.UNICODE)
    name = re.sub(r'\s+', ' ', name).strip()
    # descarta nombres genéricos o emoji-only que quedaron vacíos
    if not name or len(name) < 2 or name.lower() in ('nan', 'none', 'null'):
        return ""
    # capitaliza cada palabra
    return " ".join(w.capitalize() for w in name.split())


# ─────────────────────────────────────────
# RESUMEN CON OLLAMA
# ─────────────────────────────────────────
def ollama_summary(session: requests.Session, nombre: str, telefono: str,
                   tag_estado: str, conv: str) -> Tuple[str, bool]:
    """
    Retorna (texto_resumen, fue_por_ia).
    Si falla, devuelve resumen heurístico con fue_por_ia=False.
    """
    if not conv.strip():
        return "Sin conversación registrada.", False

    prompt = f"""Eres un asistente de ventas inmobiliarias. Redacta un resumen BREVE y DIRECTO para un ejecutivo humano.

INSTRUCCIONES:
- Analiza solo lo que dice CLIENTE:, el BOT: es contexto.
- Sin JSON, sin tablas, sin adornos. Solo texto plano útil.
- 3 secciones cortas: Resumen, Datos Clave, Siguiente Paso.

LEAD:
- Nombre: {nombre or 'No informado'}
- Teléfono: {telefono}
- Estado: {tag_estado or 'Sin clasificar'}

CONVERSACIÓN:
\"\"\"{conv}\"\"\"

FIN
""".strip()

    payload = {
        "model": OLLAMA_MODEL, "prompt": prompt, "stream": False,
        "keep_alive": KEEP_ALIVE,
        "options": {"temperature": TEMPERATURE, "num_predict": NUM_PREDICT, "stop": ["FIN"]},
    }

    try:
        r = session.post(OLLAMA_URL, json=payload, timeout=TIMEOUT)
        r.raise_for_status()
        text = (r.json().get("response") or "").replace("FIN", "").strip()
        if text:
            return text, True
    except Exception as e:
        print(f"   ⚠️  Ollama falló: {e}")

    # Fallback heurístico
    client_lines = [ln for ln in conv.splitlines() if ln.startswith("CLIENTE:")]
    snippet = " | ".join(ln.replace("CLIENTE:", "").strip() for ln in client_lines[-4:])
    if not snippet:
        snippet = conv[:300]
    return f"Resumen automático: {snippet[:350]}", False


# ─────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description="Normalizador con IA para CSVs de chat")
    parser.add_argument("input_csv", help="Ruta al CSV de entrada (ej: prueba1.csv)")
    parser.add_argument("--output", help="Ruta del CSV de salida (por defecto: <input>_ai_normalized.csv)")
    parser.add_argument("--no-llm", action="store_true", help="Saltar Ollama y usar solo heurística")
    args = parser.parse_args()

    if not os.path.exists(args.input_csv):
        print(f"❌ Archivo no encontrado: {args.input_csv}")
        sys.exit(1)

    output_path = args.output or args.input_csv.replace(".csv", "_ai_normalized.csv")

    session = requests.Session()

    if not args.no_llm:
        ensure_ollama(session)
        warmup(session)

    print(f"\n📂 Leyendo: {args.input_csv}")
    df = read_csv_envuelto(args.input_csv)
    print(f"   {len(df)} leads encontrados.\n")

    results = []
    total = len(df)

    for i, row in df.iterrows():
        nombre_raw   = str(row.get("nombre_usuario", "")).strip()
        telefono_raw = str(row.get("telefono_raw", "")).strip()
        project_tag  = str(row.get("project_tag", "")).strip()
        tag_estado   = str(row.get("tag_estado", "")).strip()
        trans_raw    = str(row.get("transcripcion", "")).strip()

        # 1. Parsear la conversación
        conv = parse_chat(trans_raw)

        # 2. Extraer campos estructurados
        nombre    = clean_name(nombre_raw)
        email     = extract_email(conv)
        telefono  = extract_phone(telefono_raw, conv)
        renta     = extract_renta(conv)
        proyecto  = project_tag if project_tag and project_tag.lower() not in ('nan', 'none', '') else ""

        # 3. Generar resumen con IA (o heurística)
        if not args.no_llm:
            resumen, por_ia = ollama_summary(session, nombre, telefono, tag_estado, conv)
        else:
            client_lines = [ln.replace("CLIENTE:", "").strip()
                            for ln in conv.splitlines() if ln.startswith("CLIENTE:")]
            resumen = " | ".join(client_lines[-4:])[:400] or "Sin conversación."
            por_ia = False

        # 4. Formatear observacion con icono 🤖 si fue procesado por IA
        if por_ia:
            # Incluir estado si es relevante
            estado_label = f"[{tag_estado}] " if tag_estado and tag_estado.lower() not in ('', 'nan') else ""
            observacion = f"🤖 {estado_label}{resumen}"
        else:
            observacion = resumen

        # 5. Limpiar caracteres especiales no deseados del nombre
        nombre_final = nombre if nombre else nombre_raw[:50]

        results.append({
            "nombre":      nombre_final,
            "email":       email,
            "telefono":    telefono,
            "renta":       renta,
            "proyecto":    proyecto,
            "observacion": observacion,
        })

        status = "🤖 IA" if por_ia else "⚙️  heurística"
        print(f"[{i+1:02d}/{total}] {nombre_final:<25} {telefono:<15} {status}")

    # Guardar CSV normalizado
    final_df = pd.DataFrame(results)
    final_df.to_csv(output_path, index=False, encoding="utf-8")

    print(f"\n{'='*60}")
    print(f"✅ Archivo generado: {output_path}")
    print(f"   Total leads: {len(final_df)}")
    ia_count  = sum(1 for r in results if r["observacion"].startswith("🤖"))
    print(f"   Con perfil IA 🤖: {ia_count}")
    print(f"   Sin perfil (heurística): {total - ia_count}")
    print(f"{'='*60}\n")

    # Mostrar preview de los primeros 5
    print("📋 PREVIEW (primeros 5 leads):")
    print("-" * 80)
    preview = final_df.head(5)
    for _, r in preview.iterrows():
        obs_short = r['observacion'][:120].replace('\n', ' ')
        print(f"  Nombre:    {r['nombre']}")
        print(f"  Email:     {r['email'] or '(no encontrado)'}")
        print(f"  Teléfono:  {r['telefono']}")
        print(f"  Renta:     {r['renta']}")
        print(f"  Proyecto:  {r['proyecto'] or '(no especificado)'}")
        print(f"  Observ:    {obs_short}...")
        print()


if __name__ == "__main__":
    main()
