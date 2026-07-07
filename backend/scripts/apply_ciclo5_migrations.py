"""Aplica migraciones SQL idempotentes de Ciclo 5 (envios y ventas)."""
import os
import sys
import time
from pathlib import Path

import psycopg2

MIGRATIONS = (
    '11_migracion_envios_ciclo5.sql',
    '13_migracion_ventas_envio_ciclo5.sql',
)


def _statements(sql_text: str):
    for chunk in sql_text.split(';'):
        lines = [
            line for line in chunk.splitlines()
            if line.strip() and not line.strip().startswith('--')
        ]
        if lines:
            yield '\n'.join(lines)


def _connect(database_url: str):
    last_error = None
    for attempt in range(30):
        try:
            return psycopg2.connect(database_url)
        except psycopg2.OperationalError as exc:
            last_error = exc
            time.sleep(2)
    raise last_error


def main():
    database_url = (os.environ.get('DATABASE_URL') or '').strip()
    if not database_url:
        print('DATABASE_URL no definida; se omiten migraciones Ciclo 5.', file=sys.stderr)
        return 0

    db_dir = Path(__file__).resolve().parent.parent / 'db'
    conn = _connect(database_url)
    conn.autocommit = True

    try:
        with conn.cursor() as cur:
            for migration in MIGRATIONS:
                path = db_dir / migration
                if not path.exists():
                    print(f'Archivo no encontrado: {path}', file=sys.stderr)
                    continue
                print(f'Aplicando {migration}...')
                sql_text = path.read_text(encoding='utf-8')
                for statement in _statements(sql_text):
                    cur.execute(statement)
                print(f'OK {migration}')
    finally:
        conn.close()

    print('Migraciones Ciclo 5 aplicadas.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
