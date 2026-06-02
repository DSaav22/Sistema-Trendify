#!/bin/sh
set -e

echo "Esperando PostgreSQL..."
python - <<'PY'
import os
import sys
import time

import psycopg2

url = os.environ.get("DATABASE_URL")
if not url:
    sys.exit("DATABASE_URL no esta definida")

for attempt in range(60):
    try:
        conn = psycopg2.connect(url)
        conn.close()
        print("PostgreSQL listo.")
        break
    except psycopg2.OperationalError:
        time.sleep(2)
else:
    sys.exit("Timeout: PostgreSQL no respondio a tiempo")
PY

echo "Sincronizando migraciones Django (fake)..."
python manage.py migrate --fake

echo "Restableciendo contrasenas seed a 123456..."
python scripts/reset_passwords_and_list_users.py

exec "$@"
