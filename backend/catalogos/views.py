from decimal import Decimal
from io import BytesIO

from django.db import transaction
from django.http import HttpResponse, Http404
from django.shortcuts import get_object_or_404
from django.template.loader import render_to_string
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
    Compra,
    DetalleCompra,
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
    CompraSerializer,
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
from .permissions import (
    IsAdminOrAuditorRole,
    IsAdminOrComprasRole,
    IsAdminOrVendedorRole,
    IsAdminRole,
    IsCatalogoReadRole,
    IsClienteRole,
    IsInventarioRole,
)


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
    permission_classes = [IsCatalogoReadRole]


class MarcaViewSet(BitacoraMixin, viewsets.ModelViewSet):
    queryset = Marca.objects.all()
    serializer_class = MarcaSerializer
    permission_classes = [IsCatalogoReadRole]


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
    permission_classes = [IsAdminOrComprasRole]


class ProductoViewSet(BitacoraMixin, viewsets.ModelViewSet):
    queryset = Producto.objects.all()
    serializer_class = ProductoSerializer
    permission_classes = [IsCatalogoReadRole]


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
    permission_classes = [IsInventarioRole]


class MovimientoInventarioViewSet(BitacoraMixin, viewsets.ModelViewSet):
    queryset = MovimientoInventario.objects.all()
    serializer_class = MovimientoInventarioSerializer
    permission_classes = [IsInventarioRole]


class BitacoraViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Bitacora.objects.select_related('id_usuario').all().order_by('-fecha_hora')
    serializer_class = BitacoraSerializer
    permission_classes = [IsAdminOrAuditorRole]


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

        metodo_pago = (serializer.validated_data.get('metodo_pago') or '').strip().lower()
        monto_recibido_in = serializer.validated_data.get('monto_recibido')
        numero_comprobante_in = (serializer.validated_data.get('numero_comprobante') or '').strip() or None
        imagen_qr_url_in = (serializer.validated_data.get('imagen_qr_url') or '').strip() or None

        monto_total = Decimal('0.00')

        with transaction.atomic():
            venta = Venta.objects.create(
                id_cliente=serializer.validated_data['id_cliente'],
                id_usuario=usuario,
                fecha_hora=timezone.now(),
                monto_total=Decimal('0.00'),
                metodo_pago=metodo_pago,
                estado_venta=serializer.validated_data.get('estado_venta') or 'completada',
                numero_comprobante=numero_comprobante_in,
                imagen_qr_url=imagen_qr_url_in,
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

            # CU09 — validacion de pago segun metodo
            if metodo_pago == 'efectivo':
                if monto_recibido_in is None:
                    transaction.set_rollback(True)
                    return Response(
                        {'detail': 'En pago en efectivo es obligatorio el monto recibido.'},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                monto_recibido = Decimal(str(monto_recibido_in))
                if monto_recibido < monto_total:
                    transaction.set_rollback(True)
                    return Response(
                        {'detail': f'El monto recibido ({monto_recibido}) es menor al total ({monto_total}).'},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                venta.monto_recibido = monto_recibido
                venta.vuelto = monto_recibido - monto_total
            elif metodo_pago in ('qr', 'pago_movil_qr', 'transferencia'):
                if not numero_comprobante_in:
                    transaction.set_rollback(True)
                    return Response(
                        {'detail': 'En pagos QR o transferencia el numero de comprobante es obligatorio.'},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                venta.monto_recibido = monto_total
                venta.vuelto = Decimal('0.00')
            else:
                # tarjeta u otros: solo se exige que cuadre el total
                venta.monto_recibido = monto_total
                venta.vuelto = Decimal('0.00')

            venta.monto_total = monto_total
            venta.save(update_fields=['monto_total', 'monto_recibido', 'vuelto'])

        self._registrar_bitacora(
            accion='INSERT',
            tabla_afectada=venta._meta.db_table,
            registro_afectado_id=venta.pk,
            detalle=f'Se creo registro {venta._meta.model_name} con id={venta.pk} por {monto_total}.',
        )

        output = self.get_serializer(venta)
        headers = self.get_success_headers(output.data)
        return Response(output.data, status=status.HTTP_201_CREATED, headers=headers)


class ReciboVentaView(APIView):
    """CU10 — Genera el recibo de una venta en HTML o PDF.

    Permisos: AllowAny intencionalmente, porque el recibo se abre desde
    un link <a target="_blank"> que no propaga el Bearer token, y tambien
    se envia por WhatsApp como URL publica. La unica forma de acceder
    es conociendo el id_venta.
    """
    permission_classes = [AllowAny]

    def get(self, request, pk, *args, **kwargs):
        formato = (request.query_params.get('formato') or 'html').strip().lower()

        venta = (
            Venta.objects
            .select_related('id_cliente', 'id_usuario')
            .filter(pk=pk)
            .first()
        )
        if venta is None:
            raise Http404('Venta no encontrada.')

        detalles = (
            DetalleVenta.objects
            .select_related('id_producto')
            .filter(id_venta=venta)
            .order_by('id_detalle_venta')
        )

        contexto = {'venta': venta, 'detalles': detalles}
        html = render_to_string('recibos/recibo_venta.html', contexto)

        if formato == 'pdf':
            try:
                from xhtml2pdf import pisa
            except ImportError:
                return HttpResponse(
                    'xhtml2pdf no esta instalado. Ejecuta: pip install xhtml2pdf',
                    status=500,
                )
            buffer = BytesIO()
            resultado = pisa.CreatePDF(html, dest=buffer)
            if resultado.err:
                return HttpResponse('Error al generar PDF.', status=500)
            response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
            response['Content-Disposition'] = (
                f'inline; filename="recibo_venta_{venta.id_venta}.pdf"'
            )
            return response

        # default: HTML
        return HttpResponse(html, content_type='text/html; charset=utf-8')


class CompraViewSet(BitacoraMixin, viewsets.ModelViewSet):
    queryset = (
        Compra.objects
        .select_related('id_proveedor', 'id_usuario')
        .prefetch_related('detalles_compra')
        .all()
        .order_by('-fecha_compra')
    )
    serializer_class = CompraSerializer
    permission_classes = [IsAdminOrComprasRole]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        detalles = serializer.validated_data.pop('detalles', [])
        if not detalles:
            return Response(
                {'detail': 'Debes enviar al menos un item en detalles.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        usuario = getattr(request, 'user', None)
        if usuario is None or not hasattr(usuario, 'id_usuario'):
            return Response(
                {'detail': 'Usuario no autenticado.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        proveedor = serializer.validated_data['id_proveedor']
        if (proveedor.estado or '').lower() != 'activo':
            return Response(
                {'detail': 'El proveedor no esta activo.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        monto_total = Decimal('0.00')

        with transaction.atomic():
            compra = Compra.objects.create(
                id_proveedor=proveedor,
                id_usuario=usuario,
                fecha_compra=timezone.now(),
                monto_total=Decimal('0.00'),
                estado_compra=serializer.validated_data.get('estado_compra') or 'completada',
            )

            for detalle in detalles:
                producto = detalle['id_producto']
                cantidad = int(detalle['cantidad'])
                precio_unitario = Decimal(str(detalle['precio_unitario']))
                subtotal = precio_unitario * cantidad

                DetalleCompra.objects.create(
                    id_compra=compra,
                    id_producto=producto,
                    lote=detalle.get('lote') or None,
                    fecha_vencimiento=detalle.get('fecha_vencimiento') or None,
                    cantidad=cantidad,
                    precio_unitario=precio_unitario,
                    subtotal=subtotal,
                )

                MovimientoInventario.objects.create(
                    id_producto=producto,
                    id_usuario=usuario,
                    tipo_movimiento='entrada',
                    cantidad=cantidad,
                    motivo=f'Ingreso por compra #{compra.id_compra}',
                )

                monto_total += subtotal

            compra.monto_total = monto_total
            compra.save(update_fields=['monto_total'])

        self._registrar_bitacora(
            accion='INSERT',
            tabla_afectada=compra._meta.db_table,
            registro_afectado_id=compra.pk,
            detalle=f'Se creo registro {compra._meta.model_name} con id={compra.pk} por {monto_total}.',
        )

        output = self.get_serializer(compra)
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
