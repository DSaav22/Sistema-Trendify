import os
import sys
from pathlib import Path

import django
from django.contrib.auth.hashers import check_password, make_password


BACKEND_DIR = Path(__file__).resolve().parent.parent
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
os.chdir(BACKEND_DIR)
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))


django.setup()

from catalogos.models import Rol, Usuario  # noqa: E402


print('=== ROLES ===')
for rol in Rol.objects.order_by('id_rol'):
    print(f"[{rol.id_rol}] {rol.nombre_rol} | {rol.descripcion or '-'}")

print('\n=== USUARIOS ===')
for user in Usuario.objects.select_related('id_rol').order_by('id_usuario'):
    print(
        f"[{user.id_usuario}] username={user.username} | "
        f"nombre={user.nombre_completo} | rol={user.id_rol.nombre_rol}"
    )

nuevo_hash = make_password('123456')
afectados = Usuario.objects.all().update(password_hash=nuevo_hash)
print(f'\nUSUARIOS ACTUALIZADOS: {afectados}')

print("\n=== VERIFICACION check_password('123456') ===")
for user in Usuario.objects.order_by('id_usuario'):
    print(f"{user.username}: {check_password('123456', user.password_hash)}")
