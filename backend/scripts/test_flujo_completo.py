import os
import sys
import time

try:
    import requests
except ImportError as exc:
    print('ERROR: Falta la libreria requests. Instala con: pip install requests')
    raise SystemExit(1) from exc


BASE_URL = os.getenv('BASE_URL', 'http://127.0.0.1:8000')
USERNAME = os.getenv('TEST_USERNAME', 'smartinez')
PASSWORD = os.getenv('TEST_PASSWORD', '123456')
MARCA_ID = int(os.getenv('TEST_MARCA_ID', '1'))


def fail(message):
    print(f'ERROR: {message}')
    raise SystemExit(1)


def normalize_list(data):
    if isinstance(data, list):
        return data
    if isinstance(data, dict) and isinstance(data.get('results'), list):
        return data['results']
    return []


def request_json(method, url, **kwargs):
    response = requests.request(method, url, timeout=20, **kwargs)

    try:
        payload = response.json() if response.text else {}
    except Exception:
        payload = {'raw': response.text}

    if response.status_code >= 400:
        fail(f'{method} {url} -> {response.status_code} | {payload}')

    return payload


def find_insert_log(logs, table_name, record_id):
    for log in logs:
        accion = str(log.get('accion', '')).upper()
        tabla = str(log.get('tabla_afectada', '')).lower()
        registro = log.get('registro_afectado_id')

        if accion == 'INSERT' and tabla == table_name and int(registro or -1) == int(record_id):
            return True
    return False


def main():
    print('1) Login para obtener JWT...')
    login_data = request_json(
        'POST',
        f'{BASE_URL}/api/auth/login/',
        json={'username': USERNAME, 'password': PASSWORD},
    )

    access_token = login_data.get('access_token') or login_data.get('access')
    if not access_token:
        fail(f'La respuesta de login no contiene access token: {login_data}')

    headers = {'Authorization': f'Bearer {access_token}'}

    print('2) Leer bitacora antes de pruebas...')
    before_logs_raw = request_json('GET', f'{BASE_URL}/api/bitacora/', headers=headers)
    before_logs = normalize_list(before_logs_raw)

    suffix = int(time.time())
    category_name = f'CAT_TEST_{suffix}'
    product_name = f'PROD_TEST_{suffix}'

    print('3) Crear categoria de prueba...')
    categoria_data = request_json(
        'POST',
        f'{BASE_URL}/api/categorias/',
        headers=headers,
        json={
            'nombre': category_name,
            'descripcion': 'Categoria creada por test_flujo_completo.py',
            'estado': 'activo',
        },
    )

    categoria_id = categoria_data.get('id_categoria') or categoria_data.get('id')
    if not categoria_id:
        fail(f'No se pudo identificar id de categoria creada: {categoria_data}')

    print('4) Crear producto de prueba asociado a la categoria...')
    producto_data = request_json(
        'POST',
        f'{BASE_URL}/api/productos/',
        headers=headers,
        json={
            'id_categoria': int(categoria_id),
            'id_marca': MARCA_ID,
            'nombre': product_name,
            'descripcion': 'Producto de prueba automatizada',
            'precio_compra': '8.50',
            'precio_venta': '12.75',
            'atributos': {'origen': 'test_flujo_completo'},
            'estado': 'activo',
        },
    )

    producto_id = producto_data.get('id_producto') or producto_data.get('id')
    if not producto_id:
        fail(f'No se pudo identificar id de producto creado: {producto_data}')

    print('5) Leer bitacora despues de inserciones...')
    after_logs_raw = request_json('GET', f'{BASE_URL}/api/bitacora/', headers=headers)
    after_logs = normalize_list(after_logs_raw)

    if len(after_logs) < len(before_logs) + 2:
        fail(
            'La bitacora no crecio lo esperado. '
            f'Antes={len(before_logs)}, Despues={len(after_logs)}'
        )

    has_categoria_insert = find_insert_log(after_logs, 'categorias', categoria_id)
    has_producto_insert = find_insert_log(after_logs, 'productos', producto_id)

    if not has_categoria_insert or not has_producto_insert:
        fail(
            'No se encontraron los registros esperados en bitacora para categorias/productos. '
            f'categoria_ok={has_categoria_insert}, producto_ok={has_producto_insert}'
        )

    print('TEST EXITOSO')
    print(f'Categoria creada: id={categoria_id}, nombre={category_name}')
    print(f'Producto creado: id={producto_id}, nombre={product_name}')


if __name__ == '__main__':
    main()
