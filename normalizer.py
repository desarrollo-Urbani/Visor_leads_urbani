import pandas as pd
import re
import sys
import os
import argparse
import json

# --- CONFIGURATION: KEYWORD MAPPING ---
# Define keywords that map to our target schema columns.
# Format: 'target_column': ['keyword1', 'keyword2', ...]
# The script will search for these keywords in the input file headers (case-insensitive).
COLUMN_MAPPING = {
    'nombre': ['nombre', 'nombres', 'cliente', 'prospecto', 'name', 'full name'],
    'apellido': ['apellido', 'apellidos', 'surname', 'last name'],  # Optional, can be merged into nombre
    'email': ['email', 'correo', 'mail', 'e-mail', 'correo electronico'],
    'telefono': ['telefono', 'fono', 'celular', 'movil', 'mobile', 'phone', 'cel'],
    'renta': ['renta', 'sueldo', 'ingreso', 'salary', 'income', 'liquido'],
    'proyecto': ['proyecto', 'obra', 'condominio', 'project'],
    'observacion': ['observacion', 'nota', 'comentario', 'detalle']
}

def clean_phone(phone_str):
    if pd.isna(phone_str): return ""
    # Remove non-digits
    digits = re.sub(r'\D', '', str(phone_str))
    
    # Chile specific rules
    if len(digits) == 8:
        return "+569" + digits
    elif len(digits) == 9 and digits.startswith('9'):
        return "+56" + digits
    elif len(digits) == 11 and digits.startswith('569'):
        return "+" + digits
    
    return digits # Return as-is if it doesn't match standard rules

def clean_rent(rent_str):
    if pd.isna(rent_str): return 0
    s = str(rent_str)
    # Handle ranges like "1.200.000_a_1.500.000" or "$1.000.000 - $1.500.000"
    # We'll take the first meaningful number found.
    # First, remove specific range separators to avoid merging numbers
    s = s.replace('_a_', ' ').replace(' a ', ' ').replace('-', ' ')
    
    # regex to find numbers that look like money (digits with potential dots)
    # We remove $ and other chars first, but keep dots if they are thousands separators
    # In Chile, . is thousands, , is decimal.
    # We'll assume input is integer-like.
    
    # Strategy: remove non-digits characters, but insert spaces where there were separators
    # to avoid merging.
    
    # 1. Replace non-digit/non-dot characters with space
    s_clean = re.sub(r'[^\d.]', ' ', s)
    
    # 2. Split by space to get potential numbers
    parts = s_clean.split()
    
    for part in parts:
        # Remove dots (thousands separators)
        clean_num_str = part.replace('.', '')
        if clean_num_str.isdigit():
            val = int(clean_num_str)
            # Basic sanity check: reject tiny numbers like "1" or "2" if they are likely IDs, 
            # but here we just want the rent.
            if val > 1000: # Assuming rent is at least 1000 CLP
                return val
            
    return 0

def clean_email(email_str):
    if pd.isna(email_str): return ""
    email = str(email_str).lower().strip()
    # Basic regex validation
    # Ensure it starts with alphanumeric to avoid \\n artifacts being captured as 'n'
    match = re.search(r"[a-z0-9][\w\.-]*@[\w\.-]+\.\w+", email)
    if match:
        return match.group(0)
    return ""

def extract_email_from_text(text):
    if pd.isna(text): return ""
    # Ensure it starts with alphanumeric to avoid \\n artifacts being captured as 'n'
    match = re.search(r"[a-z0-9][\w\.-]*@[\w\.-]+\.\w+", str(text).lower())
    if match:
        return match.group(0)
    return ""

def summarize_chat(chat_content):
    if pd.isna(chat_content) or not str(chat_content).strip():
        return ""
    
    s = str(chat_content).strip()
    
    # Check if it's JSON
    if (s.startswith('[') and s.endswith(']')) or (s.startswith('{') and s.endswith('}')):
        try:
            data = json.loads(s)
            if isinstance(data, list):
                summary_parts = []
                user_msgs = [m['message'] for m in data if m.get('sender') == 'user']
                
                # Heuristics for summary
                # 1. First user message (intent)
                if user_msgs:
                    summary_parts.append(f"Intención: {user_msgs[0]}")
                
                # 2. Look for keywords in all user messages
                keywords = {
                    'renta': ['renta', 'sueldo', 'gano', 'ingreso', 'líquido', '$'],
                    'interés': ['vivir', 'invertir', 'comprar', 'interesa'],
                    'contacto': ['llame', 'mañana', 'tarde', 'horario', 'contacto', 'llamar']
                }
                
                found_info = {}
                for msg in user_msgs:
                    msg_low = msg.lower()
                    for key, words in keywords.items():
                        if any(w in msg_low for w in words):
                            if key not in found_info: found_info[key] = []
                            found_info[key].append(msg.strip())
                
                if 'interés' in found_info:
                    summary_parts.append(f"Interés: {found_info['interés'][-1]}")
                if 'renta' in found_info:
                    summary_parts.append(f"Info Renta: {found_info['renta'][-1]}")
                if 'contacto' in found_info:
                    summary_parts.append(f"Preferencia Contacto: {found_info['contacto'][-1]}")
                
                if not summary_parts and user_msgs:
                    # Fallback: just join the last few user messages
                    return " | ".join(user_msgs[-3:])
                    
                return " -- ".join(summary_parts)
        except:
            pass
            
    # If not JSON or parsing fails, just clean basic characters as requested
    clean = re.sub(r'[\[\]\{\}]', '', s)
    clean = re.sub(r'"message":"(.*?)"', r'\1', clean)
    clean = re.sub(r'"sender":"(.*?)"', r'(\1):', clean)
    return clean.strip()

def normalize_file(input_path, output_path=None):
    print(f"Propcessing: {input_path}")
    
    try:
        # 1. Detect file type and read
        if input_path.endswith(('.xls', '.xlsx')):
            df = pd.read_excel(input_path)
        elif input_path.endswith('.csv'):
            # Try reading with different encodings/separators if needed, defaulting to standard
            try:
                df = pd.read_csv(input_path)
            except:
                df = pd.read_csv(input_path, sep=';', encoding='latin-1')
                
            # Check for "swallowed" CSV (single column containing the whole row)
            # This happens if rows are incorrectly wrapped in outer quotes
            if len(df.columns) > 1:
                # Heuristic: Column 0 has commas, Column 1 is mostly Empty/NaN
                col0 = df.iloc[:, 0].astype(str)
                col1_nulls = df.iloc[:, 1].isna().sum()
                total_rows = len(df)
                
                # Check for commas in first row of data
                has_commas = ',' in str(col0.iloc[0]) if len(col0) > 0 else False
                
                if has_commas and (col1_nulls > total_rows * 0.9):
                    print("Detected 'swallowed' CSV rows. Applying double-parsing fix...")
                    try:
                        import io
                        # Reconstruct CSV from column 0 values
                        # Use the original headers
                        content = "\n".join(col0)
                        df_fixed = pd.read_csv(io.StringIO(content), header=None, names=df.columns)
                        df = df_fixed
                        print("Double-parsing successful. Shape:", df.shape)
                    except Exception as e:
                        print(f"Double-parsing failed: {e}. Continuing with original DF.")
                        
        else:
            print("Error: Unsupported file format. Use .csv or .xlsx")
            return

    except Exception as e:
        print(f"Error reading file: {e}")
        return

    # 2. Normalize Columns
    df.columns = [c.strip().lower() for c in df.columns]
    renamed_cols = {}
    
    found_cols = []
    
    for target, keywords in COLUMN_MAPPING.items():
        for col in df.columns:
            if any(k in col for k in keywords):
                renamed_cols[col] = target
                found_cols.append(target)
                break # Map the first matching column found for this target
    
    print(f"Mapped columns: {renamed_cols}")
    df = df.rename(columns=renamed_cols)

    # 3. Create missing columns as empty
    required_cols = ['nombre', 'email', 'telefono', 'renta', 'proyecto']
    for col in required_cols:
        if col not in df.columns:
            print(f"Warning: Column '{col}' not found. Creating empty.")
            df[col] = ""

    # 4. Clean Data
    if 'telefono' in df.columns:
        df['telefono'] = df['telefono'].apply(clean_phone)
    
    if 'renta' in df.columns:
        df['renta'] = df['renta'].apply(clean_rent)
        
    if 'email' in df.columns:
        df['email'] = df['email'].apply(clean_email)
        
    # Fallback: Extract email from text columns if email is empty
    # Common columns that might contain hidden emails: 'transcripcion', 'observacion'
    # We need to check if these columns exist in the *original* dataframe or mapped ones.
    # The dataframe 'df' now has mapped names. 'observacion' might be one.
    # 'transcripcion' might not have been mapped if we didn't add it to keywords.
    
    # Let's check for 'transcripcion' specifically as per user case, or just scan all object columns?
    # Better to be specific if we can.
    
    text_cols_to_scan = ['transcripcion', 'observacion', 'notas', 'message', 'mensaje']
    # Check which of these exist in df (even if not mapped to target schema yet)
    # Wait, strictly speaking we renamed everything.
    # But unmapped columns are still there if we didn't drop them yet.
    # My previous code did: df = df.rename(...)
    # It didn't drop other columns yet.
    
    possible_text_cols = [c for c in df.columns if any(x in c for x in text_cols_to_scan)]
    
    if 'email' in df.columns and len(possible_text_cols) > 0:
        print(f"Scanning for emails in text columns: {possible_text_cols}...")
        for idx, row in df.iterrows():
            if not row['email']: # If email is missing
                for col in possible_text_cols:
                    extracted = extract_email_from_text(row[col])
                    if extracted:
                        df.at[idx, 'email'] = extracted
                        break
        
    # Merge Name and Last Name if separate
    if 'apellido' in df.columns and 'nombre' in df.columns:
        df['nombre'] = df['nombre'].astype(str) + " " + df['apellido'].astype(str)
        
    # 5. Export
    # Keep only target columns + observacion. 
    # Current logic: final_df = df[required_cols + ([c for c in df.columns if c not in required_cols and c in ['observacion']])]
    # But wait, 'transcripcion' might be useful context to keep as 'observacion' if 'observacion' is empty?
    # For now let's stick to the plan.
    
    final_cols = []
    for c in required_cols:
        final_cols.append(c)
    
    # If we have 'observacion', keep it.
    if 'observacion' in df.columns and 'observacion' not in final_cols:
         final_cols.append('observacion')
         
    # If we don't have observacion but have transcription, potentially map it?
    # User didn't ask explicitly, but 'transcripcion' in prueba1 seems important.
    # Let's map 'transcripcion' to 'observacion' if 'observacion' is missing.
    if 'observacion' not in df.columns:
        # Look for transcript-like columns
        for col in df.columns:
            if 'transcripcion' in col:
                df['observacion'] = df[col]
                final_cols.append('observacion')
                break

    final_df = df[final_cols].copy()
    
    # 6. Apply intelligent summary to 'observacion'
    if 'observacion' in final_df.columns:
        print("Creating human-readable summaries for 'observacion'...")
        final_df['observacion'] = final_df['observacion'].apply(summarize_chat)
    
    if not output_path:
        base, ext = os.path.splitext(input_path)
        output_path = f"{base}_normalized.csv"
        
    final_df.to_csv(output_path, index=False, encoding='utf-8')
    print(f"Success! Normalized file saved to: {output_path}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python normalizer.py <input_file>")
    else:
        normalize_file(sys.argv[1])
