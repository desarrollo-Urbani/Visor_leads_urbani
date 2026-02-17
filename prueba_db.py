import psycopg2

# Usa la IP de Tailscale de tu PC viejo que ya tienes anotada
DB_CONFIG = {
    "host": "100.65.92.48",
    "database": "antigravity_db",
    "user": "admin_urbani",
    "password": "password123",
    "port": "5432"
}

try:
    conn = psycopg2.connect(**DB_CONFIG)
    print("✅ ¡Conexión exitosa al servidor local!")
    cur = conn.cursor()
    cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';")
    print("Tablas encontradas:", [table[0] for table in cur.fetchall()])
    cur.close()
    conn.close()
except Exception as e:
    print(f"❌ Error: {e}")