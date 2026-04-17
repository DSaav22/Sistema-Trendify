from decimal import Decimal

from django.db import transaction
from django.utils import timezone
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from rest_framework import status, viewsets
from rest_framework.response import Response

# Importa modelos y serializers de esta misma app.
from .models import (
    Bitacora,
    Categoria,
    Cliente,
    DetalleVenta,
    Inventario,
    Marca,
    MovimientoInventario,
    Producto,
    Proveedor,
    Rol,
    Usuario,
    Venta,
)
from .serializers import (
    BitacoraSerializer,
    CategoriaSerializer,
    ClienteSerializer,
    DetalleVentaSerializer,
    InventarioSerializer,
    MarcaSerializer,
    MovimientoInventarioSerializer,
    ProductoSerializer,
    ProveedorSerializer,
    RolSerializer,
    UsuarioSerializer,
    VentaSerializer,
)
from .permissions import IsAdminOrVendedorRole, IsAdminRole, IsClienteRole


class BitacoraMixin:
    def _get_client_ip(self):
        forwarded_for = self.request.META.get('HTTP_X_FORWARDED_FOR', '')
        if forwarded_for:
            return forwarded_for.split(',')[0].strip()
        return self.request.META.get('REMOTE_ADDR')

    def _get_usuario_bitacora(self):
        usuario = getattr(self.request, 'user', None)
        if usuario is None:
            return None

        if not hasattr(usuario, 'id_usuario'):
            return None

        return usuario

    def _registrar_bitacora(self, *, accion, tabla_afectada, registro_afectado_id, detalle):
        usuario = self._get_usuario_bitacora()
        if usuario is None:
            return

        Bitacora.objects.create(
            id_usuario=usuario,
            accion=accion,
            tabla_afectada=tabla_afectada,
            registro_afectado_id=registro_afectado_id,
            detalle=detalle,
            fecha_hora=timezone.now(),
            direccion_ip=self._get_client_ip(),
        )

    def perform_create(self, serializer):
        instance = serializer.save()
        self._registrar_bitacora(
            accion='INSERT',
            tabla_afectada=instance._meta.db_table,
            registro_afectado_id=instance.pk,
            detalle=f'Se creo registro {instance._meta.model_name} con id={instance.pk}.',
        )

    def perform_update(self, serializer):
        instance = serializer.save()
        self._registrar_bitacora(
            accion='UPDATE',
            tabla_afectada=instance._meta.db_table,
            registro_afectado_id=instance.pk,
            detalle=f'Se actualizo registro {instance._meta.model_name} con id={instance.pk}.',
        )

    def perform_destroy(self, instance):
        tabla_afectada = instance._meta.db_table
        registro_afectado_id = instance.pk
        detalle = f'Se elimino registro {instance._meta.model_name} con id={instance.pk}.'

        super().perform_destroy(instance)

        self._registrar_bitacora(
            accion='DELETE',
            tabla_afectada=tabla_afectada,
            registro_afectado_id=registro_afectado_id,
            detalle=detalle,
        )


class RolViewSet(BitacoraMixin, viewsets.ModelViewSet):
    queryset = Rol.objects.all()
    serializer_class = RolSerializer
    permission_classes = [IsAdminRole]


class CategoriaViewSet(BitacoraMixin, viewsets.ModelViewSet):
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer
    permission_classes = [IsAdminOrVendedorRole]


class MarcaViewSet(BitacoraMixin, viewsets.ModelViewSet):
    queryset = Marca.objects.all()
    serializer_class = MarcaSerializer
    permission_classes = [IsAdminOrVendedorRole]


class UsuarioViewSet(BitacoraMixin, viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer
    permission_classes = [IsAdminRole]


class ClienteViewSet(BitacoraMixin, viewsets.ModelViewSet):
    queryset = Cliente.objects.all()
    serializer_class = ClienteSerializer
    permission_classes = [IsAdminOrVendedorRole]


class ProveedorViewSet(BitacoraMixin, viewsets.ModelViewSet):
    queryset = Proveedor.objects.all()
    serializer_class = ProveedorSerializer
    permission_classes = [IsAdminOrVendedorRole]


class ProductoViewSet(BitacoraMixin, viewsets.ModelViewSet):
    queryset = Producto.objects.all()
    serializer_class = ProductoSerializer
    permission_classes = [IsAdminOrVendedorRole]


class MisPedidosView(APIView):
    permission_classes = [IsClienteRole]

    def get(self, request):
        usuario = request.user
        cliente = Cliente.objects.filter(id_usuario_fk=usuario).first()
        if not cliente:
            return Response([])
        
        ventas = Venta.objects.filter(id_cliente=cliente).order_by('-fecha_hora').prefetch_related('detalles_venta')
        serializer = VentaSerializer(ventas, many=True)
        return Response(serializer.data)

class CategoriaPublicaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Categoria.objects.all().order_by('nombre')
    serializer_class = CategoriaSerializer
    permission_classes = [AllowAny]


class ProductoPublicoViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Producto.objects.select_related('id_categoria', 'id_marca').all().order_by('nombre')
    serializer_class = ProductoSerializer
    permission_classes = [AllowAny]


class InventarioViewSet(BitacoraMixin, viewsets.ModelViewSet):
    queryset = Inventario.objects.all()
    serializer_class = InventarioSerializer
    permission_classes = [IsAdminOrVendedorRole]


class MovimientoInventarioViewSet(BitacoraMixin, viewsets.ModelViewSet):
    queryset = MovimientoInventario.objects.all()
    serializer_class = MovimientoInventarioSerializer
    permission_classes = [IsAdminOrVendedorRole]


class BitacoraViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Bitacora.objects.select_related('id_usuario').all().order_by('-fecha_hora')
    serializer_class = BitacoraSerializer
    permission_classes = [IsAdminRole]


class VentaViewSet(BitacoraMixin, viewsets.ModelViewSet):
    queryset = Venta.objects.select_related('id_cliente', 'id_usuario').prefetch_related('detalles_venta').all().order_by('-fecha_hora')
    serializer_class = VentaSerializer
    permission_classes = [IsAdminOrVendedorRole]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        detalles = serializer.validated_data.pop('detalles', [])
        if not detalles:
            return Response({'detail': 'Debes enviar al menos un item en detalles.'}, status=status.HTTP_400_BAD_REQUEST)

        usuario = getattr(request, 'user', None)
        if usuario is None or not hasattr(usuario, 'id_usuario'):
            return Response({'detail': 'Usuario no autenticado.'}, status=status.HTTP_401_UNAUTHORIZED)

        monto_total = Decimal('0.00')

        with transaction.atomic():
            venta = Venta.objects.create(
                id_cliente=serializer.validated_data['id_cliente'],
                id_usuario=usuario,
                fecha_hora=timezone.now(),
                monto_total=Decimal('0.00'),
                metodo_pago=serializer.validated_data['metodo_pago'],
                estado_venta=serializer.validated_data.get('estado_venta') or 'completada',
            )

            for detalle in detalles:
                producto = detalle['id_producto']
                cantidad = int(detalle['cantidad'])
                precio_unitario = Decimal(str(producto.precio_venta))
                subtotal = precio_unitario * cantidad

                DetalleVenta.objects.create(
                    id_venta=venta,
                    id_producto=producto,
                    cantidad=cantidad,
                    precio_unitario=precio_unitario,
                    subtotal=subtotal,
                )

                MovimientoInventario.objects.create(
                    id_producto=producto,
                    id_usuario=usuario,
                    tipo_movimiento='salida',
                    cantidad=cantidad,
                    motivo='Venta desde POS',
                )

                monto_total += subtotal

            venta.monto_total = monto_total
            venta.save(update_fields=['monto_total'])

        self._registrar_bitacora(
            accion='INSERT',
            tabla_afectada=venta._meta.db_table,
            registro_afectado_id=venta.pk,
            detalle=f'Se creo registro {venta._meta.model_name} con id={venta.pk} por {monto_total}.',
        )

        output = self.get_serializer(venta)
        headers = self.get_success_headers(output.data)
        return Response(output.data, status=status.HTTP_201_CREATED, headers=headers)


class CheckoutPublicoView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        cliente_data = request.data.get('cliente') or {}
        carrito = request.data.get('carrito') or []
        metodo_pago = (request.data.get('metodo_pago') or 'pago_movil_qr').strip()

        usuario_autenticado = request.user if request.user and request.user.is_authenticated else None
        # Si esta autenticado y tiene rol 3, intentamos sacar el cliente directamente asociado
        cliente_autenticado = None
        if usuario_autenticado and extract_user_role_id(usuario_autenticado) == 3:
            cliente_autenticado = Cliente.objects.filter(id_usuario_fk=usuario_autenticado).first()

        nombre = ''
        telefono = ''
        ciudad = ''
        direccion = ''

        if cliente_autenticado:
             nombre = cliente_autenticado.nombre_completo
             telefono = cliente_autenticado.telefono or ''
             ciudad = cliente_autenticado.ciudad or ''
             direccion = cliente_autenticado.direccion or ''
        else:
             nombre = str(cliente_data.get('nombre') or '').strip()
             telefono = str(cliente_data.get('telefono') or '').strip()
             ciudad = str(cliente_data.get('ciudad') or '').strip()
             direccion = str(cliente_data.get('direccion') or '').strip()

             if not nombre or not telefono or not ciudad or not direccion:
                  return Response(
                      {'detail': 'Cliente incompleto: nombre, telefono, ciudad y direccion son obligatorios.'},
                      status=status.HTTP_400_BAD_REQUEST,
                  )

        if not isinstance(carrito, list) or not carrito:
            return Response(
                {'detail': 'El carrito debe contener al menos un producto.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        usuario_sistema = Usuario.objects.filter(id_usuario=1).first() or Usuario.objects.order_by('id_usuario').first()
        if usuario_sistema is None:
            return Response(
                {'detail': 'No existe un usuario del sistema para registrar la venta.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        monto_total = Decimal('0.00')

        with transaction.atomic():
            cliente = cliente_autenticado
            
            if not cliente:
                cliente = Cliente.objects.filter(telefono=telefono).first()
                if cliente is None:
                    cliente = Cliente.objects.create(
                        nombre_completo=nombre,
                        telefono=telefono,
                        ciudad=ciudad,
                        direccion=direccion,
                        es_top=False,
                        estado='activo',
                    )
                else:
                    cliente.nombre_completo = nombre
                    cliente.ciudad = ciudad
                    cliente.direccion = direccion
                    cliente.save(update_fields=['nombre_completo', 'ciudad', 'direccion'])

            venta = Venta.objects.create(
                id_cliente=cliente,
                id_usuario=usuario_sistema,
                fecha_hora=timezone.now(),
                monto_total=Decimal('0.00'),
                metodo_pago=metodo_pago,
                estado_venta='completada',
            )

            for item in carrito:
                id_producto = item.get('id_producto') or item.get('id')

                try:
                    cantidad = int(item.get('cantidad', 0))
                except (TypeError, ValueError):
                    return Response({'detail': 'Cantidad invalida en carrito.'}, status=status.HTTP_400_BAD_REQUEST)

                if not id_producto or cantidad <= 0:
                    return Response({'detail': 'Cada item del carrito requiere id_producto y cantidad > 0.'}, status=status.HTTP_400_BAD_REQUEST)

                producto = Producto.objects.select_for_update().filter(id_producto=id_producto).first()
                if producto is None:
                    return Response({'detail': f'Producto no encontrado: {id_producto}.'}, status=status.HTTP_404_NOT_FOUND)

                inventario = Inventario.objects.select_for_update().filter(id_producto=producto).first()
                stock_disponible = int(inventario.stock_actual) if inventario else 0
                if cantidad > stock_disponible:
                    return Response(
                        {'detail': f'Stock insuficiente para {producto.nombre}. Disponible: {stock_disponible}.'},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                precio_unitario = Decimal(str(producto.precio_venta))
                subtotal = precio_unitario * cantidad

                DetalleVenta.objects.create(
                    id_venta=venta,
                    id_producto=producto,
                    cantidad=cantidad,
                    precio_unitario=precio_unitario,
                    subtotal=subtotal,
                )

                MovimientoInventario.objects.create(
                    id_producto=producto,
                    id_usuario=usuario_sistema,
                    tipo_movimiento='salida',
                    cantidad=cantidad,
                    motivo='Venta web publica',
                )

                monto_total += subtotal

            venta.monto_total = monto_total
            venta.save(update_fields=['monto_total'])

        return Response(
            {
                'message': 'Pago confirmado. Pedido registrado correctamente.',
                'id_venta': venta.id_venta,
                'monto_total': str(venta.monto_total),
            },
            status=status.HTTP_201_CREATED,
        )
