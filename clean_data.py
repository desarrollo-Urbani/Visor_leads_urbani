import csv
import os

input_file = 'data.csv'
output_file = 'data_cleaned.csv'

# Mapeo de columnas optimizado
# Destino: Origen(es)
mapping = {
    'nombre': ['NOMBRE', 'APELLIDO'],
    'email': ['EMAIL'],
    'telefono': ['TELEFONO2', 'TELEFONO1'],
    'rut': ['RUT'],
    'renta': ['RANGO_RENTA'],
    'proyecto': ['NOM_PROYECTO'],
    'comuna': ['COMUNA'],
    'ciudad': ['CIUDAD'],
    'region': ['REGION'],
    'observacion': ['OBSERVACION'],
    'fecha_registro': ['FECHA_REGISTRO']
}

def clean_data():
    if not os.path.exists(input_file):
        print(f"Error: No se encuentra {input_file}")
        return

    print(f"Iniciando limpieza de {input_file}...")
    
    with open(input_file, mode='r', encoding='latin-1') as f_in:
        # Detectar columnas basándose en la primera fila
        reader = csv.DictReader(f_in)
        headers = reader.fieldnames
        
        # Validar que existan las columnas mínimas
        processed_count = 0
        
        with open(output_file, mode='w', encoding='utf-8', newline='') as f_out:
            writer = csv.DictWriter(f_out, fieldnames=mapping.keys())
            writer.writeheader()
            
            for row in reader:
                clean_row = {}
                
                # 1. Nombre (Combinar)
                nombres = [row.get(col, '').strip() for col in mapping['nombre']]
                clean_row['nombre'] = ' '.join(filter(None, nombres))
                
                # 2. Email
                clean_row['email'] = row.get('EMAIL', '').strip().lower()
                
                # 3. Telefono (Prioridad TELEFONO2 si tiene +, sino TELEFONO1)
                t2 = row.get('TELEFONO2', '').strip()
                t1 = row.get('TELEFONO1', '').strip()
                clean_row['telefono'] = t2 if t2 else t1
                
                # 4. RUT
                clean_row['rut'] = row.get('RUT', '').strip()
                
                # 5. Renta
                clean_row['renta'] = row.get('RANGO_RENTA', '').strip()
                
                # 6. Proyecto
                clean_row['proyecto'] = row.get('NOM_PROYECTO', '').strip()
                
                # 7. Localidad
                clean_row['comuna'] = row.get('COMUNA', '').strip()
                clean_row['ciudad'] = row.get('CIUDAD', '').strip()
                clean_row['region'] = row.get('REGION', '').strip()
                
                # 8. Observacion
                clean_row['observacion'] = row.get('OBSERVACION', '').strip()
                
                # 9. Fecha
                clean_row['fecha_registro'] = row.get('FECHA_REGISTRO', '').strip()
                
                writer.writerow(clean_row)
                processed_count += 1

    print(f"Limpieza completada: {processed_count} filas procesadas.")
    print(f"Archivo generado: {output_file} (Reducido de 206 a 11 columnas)")

if __name__ == "__main__":
    clean_data()
