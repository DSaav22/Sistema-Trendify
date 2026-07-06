from django.urls import include, path
from rest_framework.routers import DefaultRouter

# Importa los ViewSets desde views.py de la app catalogos.
from .views import (
    BitacoraViewSet,
    CategoriaPublicaViewSet,
    CategoriaViewSet,
    CheckoutPublicoView,
    ClienteViewSet,
    CompraViewSet,
    ConfirmarRecepcionView,
    CostoEnvioView,
    EnvioViewSet,
    InventarioViewSet,
    MarcaPublicaViewSet,
    MarcaViewSet,
    MiPerfilClienteView,
    MovimientoInventarioViewSet,
    PedidoGuardadoDetalleView,
    PedidosGuardadosView,
    ProductoPublicoViewSet,
    ProductoViewSet,
    ProveedorViewSet,
    PublicRastreoView,
    ReciboVentaView,
    RolViewSet,
    StripeWebhookView,
    UsuarioViewSet,
    VentaViewSet,
    MisPedidosView,
)
from .views_reportes import ReportesViewSet
from .views_auth import CambiarPasswordView, LoginView, LogoutView, RegistroClienteView

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
router.register(r'bitacora', BitacoraViewSet, basename='bitacora')
router.register(r'ventas', VentaViewSet, basename='venta')
router.register(r'compras', CompraViewSet, basename='compra')
router.register(r'envios', EnvioViewSet, basename='envio')

public_router = DefaultRouter()
public_router.register(r'categorias', CategoriaPublicaViewSet, basename='categoria-publica')
public_router.register(r'marcas', MarcaPublicaViewSet, basename='marca-publica')
public_router.register(r'productos', ProductoPublicoViewSet, basename='producto-publico')

router.register(r'reportes', ReportesViewSet, basename='reportes')

urlpatterns = [
    # Habilita endpoints CRUD automaticos de DRF.
    path('auth/registro/', RegistroClienteView.as_view(), name='auth-registro'),
    path('auth/login/', LoginView.as_view(), name='auth-login'),
    path('auth/logout/', LogoutView.as_view(), name='auth-logout'),
    path('auth/cambiar-password/', CambiarPasswordView.as_view(), name='auth-cambiar-password'),
    path('mis-pedidos/', MisPedidosView.as_view(), name='mis-pedidos'),
    path('mi-perfil-cliente/', MiPerfilClienteView.as_view(), name='mi-perfil-cliente'),
    path('pedidos-guardados/', PedidosGuardadosView.as_view(), name='pedidos-guardados'),
    path('pedidos-guardados/<int:pk>/', PedidoGuardadoDetalleView.as_view(), name='pedido-guardado-detalle'),
    path('ventas/<int:pk>/recibo/', ReciboVentaView.as_view(), name='venta-recibo'),
    path('public/checkout/', CheckoutPublicoView.as_view(), name='checkout-publico'),
    path('public/rastrear-pedido/', PublicRastreoView.as_view(), name='rastrear-pedido'),
    path('public/costo-envio/', CostoEnvioView.as_view(), name='costo-envio'),
    path('public/confirmar-recepcion/', ConfirmarRecepcionView.as_view(), name='confirmar-recepcion'),
    path('public/payments/webhook/stripe/', StripeWebhookView.as_view(), name='webhook-stripe'),
    path('public/', include(public_router.urls)),
    path('', include(router.urls)),
]
