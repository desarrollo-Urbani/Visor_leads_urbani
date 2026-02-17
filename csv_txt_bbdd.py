import pandas as pd
import os
import glob

# === CONFIGURACIÓN ===
# Indica aquí la carpeta donde están todos tus CSV
CARPETA_RAIZ = r'C:\proyectos\visor_leads\csv_diccionario\bbdd\ExportBlock-1a417a17-da08-421d-a555-e4f416b94bb3-Part-1' 
ARCHIVO_SALIDA = 'base_conocimientos_csv.txt'

def generar_documentacion_csv():
    print(f"🔍 Escaneando archivos en: {CARPETA_RAIZ}...")
    
    with open(ARCHIVO_SALIDA, "w", encoding="utf-8") as f:
        f.write("==================================================\n")
        f.write("   DICCIONARIO DE DATOS: BASE DE CONOCIMIENTOS    \n")
        f.write("==================================================\n\n")

        # Buscamos todos los .csv dentro de la carpeta y subcarpetas
        patron = os.path.join(CARPETA_RAIZ, "**", "*.csv")
        archivos_csv = glob.glob(patron, recursive=True)

        if not archivos_csv:
            print("❌ No se encontraron archivos CSV.")
            return

        for ruta_completa in archivos_csv:
            nombre_archivo = os.path.basename(ruta_completa)
            f.write(f"ARCHIVO: {nombre_archivo}\n")
            f.write(f"RUTA: {ruta_completa}\n")
            f.write("-" * 40 + "\n")

            try:
                # Leemos una muestra pequeña para no saturar la RAM
                df = pd.read_csv(ruta_completa, nrows=5)
                
                f.write("COLUMNAS Y TIPOS:\n")
                for col in df.columns:
                    # Detectamos el tipo de dato para que el LLM sepa si es fecha, ID o texto
                    tipo = str(df[col].dtype)
                    f.write(f"  • {col:<20} | Tipo: {tipo}\n")

                f.write("\nEJEMPLO DE DATOS (Primeras 3 filas):\n")
                # Convertimos a string para que el LLM vea el formato real del dato
                f.write(df.head(3).to_string(index=False))
                f.write("\n\n" + "="*50 + "\n\n")
                
                print(f"✅ Procesado: {nombre_archivo}")

            except Exception as e:
                f.write(f"⚠️ ERROR AL LEER: {e}\n\n")
                print(f"⚠️ Error en {nombre_archivo}: {e}")

    print(f"\n✨ ¡Listo! Tu base de conocimientos está en: {ARCHIVO_SALIDA}")

if __name__ == "__main__":
    generar_documentacion_csv()