from django.urls import include, path
from rest_framework.routers import DefaultRouter

# Importa los ViewSets desde views.py de la app catalogos.
from .views import (
    CategoriaViewSet,
    ClienteViewSet,
    InventarioViewSet,
    MarcaViewSet,
    MovimientoInventarioViewSet,
    ProductoViewSet,
    ProveedorViewSet,
    RolViewSet,
    UsuarioViewSet,
)

router = DefaultRouter()
router.register(r'roles', RolViewSet, basename='rol')
router.register(r'categorias', CategoriaViewSet, basename='categoria')
router.register(r'marcas', MarcaViewSet, basename='marca')
router.register(r'usuarios', UsuarioViewSet, basename='usuario')
router.register(r'clientes', ClienteViewSet, basename='cliente')
router.register(r'proveedores', ProveedorViewSet, basename='proveedor')
router.register(r'productos', ProductoViewSet, basename='producto')
router.register(r'inventario', InventarioViewSet, basename='inventario')
router.register(r'movimientos', MovimientoInventarioViewSet, basename='movimiento-inventario')

urlpatterns = [
    # Habilita endpoints CRUD automaticos de DRF.
    path('', include(router.urls)),
]
