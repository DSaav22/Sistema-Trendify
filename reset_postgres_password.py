#!/usr/bin/env python
import psycopg2
import sys

# Intentar conectarse a PostgreSQL sin contraseña (conexión local)
try:
    print("Intentando conectar a PostgreSQL sin contraseña (ident auth)...")
    conn = psycopg2.connect(
        host="127.0.0.1",
        port="5432",
        user="postgres",
        database="postgres"
    )
    cursor = conn.cursor()
    
    # Cambiar contraseña a 'diego'
    cursor.execute("ALTER USER postgres WITH PASSWORD 'diego';")
    conn.commit()
    cursor.close()
    conn.close()
    
    print("✓ Contraseña de postgres cambiada exitosamente a 'diego'")
    sys.exit(0)
    
except psycopg2.OperationalError as e:
    print(f"✗ Error de conexión: {e}")
    print("\nInformación:")
    print("- Asegúrate de que PostgreSQL está corriendo")
    print("- Puerto esperado: 5432")
    print("- Usuario: postgres")
    sys.exit(1)
    
except Exception as e:
    print(f"✗ Error: {e}")
    sys.exit(1)
