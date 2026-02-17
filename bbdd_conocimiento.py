import mysql.connector
import pandas as pd

# Configura tus credenciales de tu contenedor Docker
config = {
    'user': 'urbani_gc2_guest_view',
    'password': '[#9"tjd:#-?D',
    'host': 'mobysuite-gc2-urbani-replica.c1zztf8orfzy.us-east-1.rds.amazonaws.com', # O la IP de tu contenedor
    'database': 'mobysuite_gc2_urbani'
}

def generar_base_conocimiento():
    conn = mysql.connector.connect(**config)
    cursor = conn.cursor()
    
    with open("base_conocimiento_sql.txt", "w") as f:
        # 1. Obtener lista de tablas
        cursor.execute("SHOW TABLES")
        tablas = [t[0] for t in cursor.fetchall()]
        
        for tabla in tablas:
            f.write(f"TABLA: {tabla}\n")
            f.write("="*30 + "\n")
            
            # 2. Obtener estructura de columnas
            cursor.execute(f"DESCRIBE {tabla}")
            columnas = cursor.fetchall()
            f.write("ESTRUCTURA:\n")
            for col in columnas:
                f.write(f" - Columna: {col[0]}, Tipo: {col[1]}, Key: {col[3]}\n")
            
            # 3. Obtener una muestra de datos (3 filas)
            f.write("\nMUESTRA DE DATOS (Primeras 3 filas):\n")
            df_sample = pd.read_sql(f"SELECT * FROM {tabla} LIMIT 3", conn)
            f.write(df_sample.to_string(index=False))
            
            f.write("\n\n" + "-"*50 + "\n\n")
            
    conn.close()
    print("Base de conocimiento generada en 'base_conocimiento_sql.txt'")

generar_base_conocimiento()