from rest_framework import serializers

# Importa los modelos desde models.py de la app catalogos.
from .models import (
    Bitacora,
    Categoria,
    Cliente,
    Compra,
    DetalleCompra,
    DetallePedidoGuardado,
    DetalleVenta,
    Envio,
    Inventario,
    Marca,
    MovimientoInventario,
    PedidoGuardado,
    Producto,
    Proveedor,
    Rol,
    Usuario,
    Venta,
)


class RolSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rol
        fields = '__all__'


class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = '__all__'


class MarcaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Marca
        fields = '__all__'


from django.contrib.auth.hashers import make_password
from django.db import transaction

class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = '__all__'

    def create(self, validated_data):
        from .models import Cliente
        password = validated_data.get('password_hash')
        if password:
            validated_data['password_hash'] = make_password(password)

        with transaction.atomic():
            usuario = super().create(validated_data)
            # Si el usuario se crea con rol Cliente (6), garantizar su ficha en
            # la tabla `clientes` vinculada por id_usuario_fk.
            if getattr(usuario.id_rol, 'id_rol', None) == 6:
                Cliente.objects.get_or_create(
                    id_usuario_fk=usuario,
                    defaults={
                        'nombre_completo': usuario.nombre_completo,
                        'telefono': '',
                        'ciudad': '',
                        'direccion': '',
                        'es_top': False,
                        'estado': usuario.estado or 'activo',
                    },
                )
            return usuario

    def update(self, instance, validated_data):
        from .models import Cliente
        password = validated_data.get('password_hash')
        if password and not str(password).startswith('pbkdf2_'):
            validated_data['password_hash'] = make_password(password)
        usuario = super().update(instance, validated_data)
        if getattr(usuario.id_rol, 'id_rol', None) == 6:
            Cliente.objects.get_or_create(
                id_usuario_fk=usuario,
                defaults={
                    'nombre_completo': usuario.nombre_completo,
                    'telefono': '',
                    'ciudad': '',
                    'direccion': '',
                    'es_top': False,
                    'estado': usuario.estado or 'activo',
                },
            )
        return usuario


class ClienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cliente
        fields = '__all__'


class ProveedorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Proveedor
        fields = '__all__'


class ProductoSerializer(serializers.ModelSerializer):
    categoria_nombre = serializers.StringRelatedField(source='id_categoria', read_only=True)
    marca_nombre = serializers.StringRelatedField(source='id_marca', read_only=True)

    class Meta:
        model = Producto
        fields = [
            'id_producto',
            'id_categoria',
            'categoria_nombre',
            'id_marca',
            'marca_nombre',
            'nombre',
            'descripcion',
            'precio_compra',
            'precio_venta',
            'atributos',
            'estado',
            'actualizado_en',
        ]


class ProductoPublicoSerializer(serializers.ModelSerializer):
    """Catalogo tienda publica: sin precio_compra; incluye stock disponible."""
    categoria_nombre = serializers.StringRelatedField(source='id_categoria', read_only=True)
    marca_nombre = serializers.StringRelatedField(source='id_marca', read_only=True)
    stock_actual = serializers.IntegerField(read_only=True)

    class Meta:
        model = Producto
        fields = [
            'id_producto',
            'id_categoria',
            'categoria_nombre',
            'id_marca',
            'marca_nombre',
            'nombre',
            'descripcion',
            'precio_venta',
            'atributos',
            'estado',
            'stock_actual',
        ]


class InventarioSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.StringRelatedField(source='id_producto', read_only=True)

    class Meta:
        model = Inventario
        fields = [
            'id_inventario',
            'id_producto',
            'producto_nombre',
            'stock_actual',
            'stock_minimo',
            'ultima_actualizacion',
        ]


class MovimientoInventarioSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.StringRelatedField(source='id_producto', read_only=True)
    usuario_nombre = serializers.StringRelatedField(source='id_usuario', read_only=True)

    class Meta:
        model = MovimientoInventario
        fields = [
            'id_movimiento',
            'id_producto',
            'producto_nombre',
            'id_usuario',
            'usuario_nombre',
            'tipo_movimiento',
            'cantidad',
            'fecha_movimiento',
            'motivo',
        ]


class BitacoraSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.StringRelatedField(source='id_usuario', read_only=True)

    class Meta:
        model = Bitacora
        fields = [
            'id_bitacora',
            'id_usuario',
            'usuario_nombre',
            'accion',
            'tabla_afectada',
            'registro_afectado_id',
            'detalle',
            'fecha_hora',
            'direccion_ip',
        ]


class DetalleVentaInputSerializer(serializers.Serializer):
    id_producto = serializers.PrimaryKeyRelatedField(queryset=Producto.objects.all())
    cantidad = serializers.IntegerField(min_value=1)


class DetalleVentaSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.StringRelatedField(source='id_producto', read_only=True)

    class Meta:
        model = DetalleVenta
        fields = [
            'id_detalle_venta',
            'id_venta',
            'id_producto',
            'producto_nombre',
            'cantidad',
            'precio_unitario',
            'subtotal',
        ]


class DetallePedidoGuardadoSerializer(serializers.ModelSerializer):
    producto = ProductoSerializer(source='id_producto', read_only=True)
    producto_nombre = serializers.StringRelatedField(source='id_producto', read_only=True)
    precio_venta = serializers.DecimalField(source='id_producto.precio_venta', max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = DetallePedidoGuardado
        fields = [
            'id_detalle_pedido_guardado',
            'id_pedido_guardado',
            'id_producto',
            'producto',
            'producto_nombre',
            'precio_venta',
            'cantidad',
        ]


class PedidoGuardadoSerializer(serializers.ModelSerializer):
    detalles_pedido_guardado = DetallePedidoGuardadoSerializer(many=True, read_only=True)

    class Meta:
        model = PedidoGuardado
        fields = [
            'id_pedido_guardado',
            'id_cliente',
            'nombre',
            'creado_en',
            'actualizado_en',
            'detalles_pedido_guardado',
        ]
        read_only_fields = ['id_cliente', 'creado_en', 'actualizado_en']


class DetalleCompraInputSerializer(serializers.Serializer):
    id_producto = serializers.PrimaryKeyRelatedField(queryset=Producto.objects.all())
    cantidad = serializers.IntegerField(min_value=1)
    precio_unitario = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=0)
    lote = serializers.CharField(max_length=50, required=False, allow_blank=True, allow_null=True)
    fecha_vencimiento = serializers.DateField(required=False, allow_null=True)
    # Permite ajustar el stock minimo del producto al registrar la compra.
    stock_minimo = serializers.IntegerField(min_value=0, required=False, allow_null=True)


class DetalleCompraSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.StringRelatedField(source='id_producto', read_only=True)

    class Meta:
        model = DetalleCompra
        fields = [
            'id_detalle_compra',
            'id_compra',
            'id_producto',
            'producto_nombre',
            'lote',
            'fecha_vencimiento',
            'cantidad',
            'precio_unitario',
            'subtotal',
        ]


class CompraSerializer(serializers.ModelSerializer):
    proveedor_nombre = serializers.StringRelatedField(source='id_proveedor', read_only=True)
    usuario_nombre = serializers.StringRelatedField(source='id_usuario', read_only=True)
    detalles = DetalleCompraInputSerializer(many=True, write_only=True)
    detalles_compra = DetalleCompraSerializer(many=True, read_only=True)

    class Meta:
        model = Compra
        fields = [
            'id_compra',
            'id_proveedor',
            'proveedor_nombre',
            'id_usuario',
            'usuario_nombre',
            'fecha_compra',
            'monto_total',
            'estado_compra',
            'detalles',
            'detalles_compra',
        ]
        read_only_fields = ['id_usuario', 'fecha_compra', 'monto_total']


class VentaSerializer(serializers.ModelSerializer):
    cliente_nombre = serializers.StringRelatedField(source='id_cliente', read_only=True)
    usuario_nombre = serializers.StringRelatedField(source='id_usuario', read_only=True)
    detalles = DetalleVentaInputSerializer(many=True, write_only=True)
    detalles_venta = DetalleVentaSerializer(many=True, read_only=True)

    class Meta:
        model = Venta
        fields = [
            'id_venta',
            'id_cliente',
            'cliente_nombre',
            'id_usuario',
            'usuario_nombre',
            'fecha_hora',
            'monto_total',
            'metodo_pago',
            'estado_venta',
            'monto_recibido',
            'vuelto',
            'numero_comprobante',
            'imagen_qr_url',
            'detalles',
            'detalles_venta',
        ]
        read_only_fields = ['id_usuario', 'fecha_hora', 'monto_total', 'vuelto', 'estado_venta']


# CU27/CU28 — Ciclo 5 Logística
TIPOS_ENVIO_VALIDOS = {'contraentrega_sc', 'transportadora_interior', 'domicilio'}
ESTADO_ENVIO_INICIAL = 'preparando'

TRANSICIONES_ENVIO = {
    'preparando': {'en_camino', 'cancelado'},
    'procesando': {'en_camino', 'cancelado', 'despachado'},
    'en_camino': {'entregado', 'cancelado'},
    'en_ruta': {'entregado', 'cancelado'},
    'despachado': {'entregado', 'cancelado', 'en_camino'},
    'entregado': set(),
    'cancelado': set(),
}

ESTADOS_ENVIO_LEGIBLES = {
    'preparando': 'Preparando tu pedido',
    'procesando': 'Preparando tu pedido',
    'en_camino': 'En camino',
    'en_ruta': 'En camino',
    'despachado': 'En camino',
    'entregado': 'Entregado',
    'cancelado': 'Cancelado',
}


def estado_envio_legible(estado):
    clave = (estado or '').strip().lower()
    return ESTADOS_ENVIO_LEGIBLES.get(clave, estado or 'Desconocido')


def validar_transicion_envio(estado_actual, estado_nuevo):
    actual = (estado_actual or '').strip().lower()
    nuevo = (estado_nuevo or '').strip().lower()
    if actual == nuevo:
        return True, None
    permitidos = TRANSICIONES_ENVIO.get(actual)
    if permitidos is None:
        return False, f'Estado actual no reconocido: {actual}.'
    if nuevo not in permitidos:
        return False, (
            f'Transicion no permitida de "{actual}" a "{nuevo}". '
            f'Permitidos: {", ".join(sorted(permitidos)) or "ninguno"}.'
        )
    return True, None


class EnvioSerializer(serializers.ModelSerializer):
    cliente_nombre = serializers.CharField(
        source='id_venta.id_cliente.nombre_completo',
        read_only=True,
    )
    cliente_telefono = serializers.CharField(
        source='id_venta.id_cliente.telefono',
        read_only=True,
    )
    monto_total = serializers.DecimalField(
        source='id_venta.monto_total',
        max_digits=12,
        decimal_places=2,
        read_only=True,
    )
    fecha_venta = serializers.DateTimeField(
        source='id_venta.fecha_hora',
        read_only=True,
    )
    estado_legible = serializers.SerializerMethodField()

    class Meta:
        model = Envio
        fields = [
            'id_envio',
            'id_venta',
            'tipo_envio',
            'empresa_transporte',
            'estado_envio',
            'estado_legible',
            'cliente_nombre',
            'cliente_telefono',
            'monto_total',
            'fecha_venta',
        ]
        read_only_fields = ['id_envio', 'estado_envio']

    def get_estado_legible(self, obj):
        return estado_envio_legible(obj.estado_envio)

    def validate_id_venta(self, venta):
        if self.instance is not None:
            return venta
        estado = (venta.estado_venta or '').strip().lower()
        if estado != 'completada':
            raise serializers.ValidationError(
                'Solo ventas completadas pueden registrar envio.'
            )
        if Envio.objects.filter(id_venta=venta).exists():
            raise serializers.ValidationError(
                'La venta ya tiene envio registrado.'
            )
        return venta

    def validate_tipo_envio(self, valor):
        clave = (valor or '').strip().lower()
        if clave not in TIPOS_ENVIO_VALIDOS:
            raise serializers.ValidationError(
                f'Tipo de envio invalido. Use: {", ".join(sorted(TIPOS_ENVIO_VALIDOS))}.'
            )
        return clave

    def validate(self, attrs):
        tipo = attrs.get('tipo_envio') or (self.instance.tipo_envio if self.instance else None)
        empresa = attrs.get(
            'empresa_transporte',
            self.instance.empresa_transporte if self.instance else None,
        )
        if tipo == 'transportadora_interior' and not str(empresa or '').strip():
            raise serializers.ValidationError({
                'empresa_transporte': 'Indica la empresa transportadora para envios al interior.',
            })
        return attrs

    def create(self, validated_data):
        validated_data['estado_envio'] = ESTADO_ENVIO_INICIAL
        return super().create(validated_data)

    def update(self, instance, validated_data):
        nuevo_estado = validated_data.get('estado_envio')
        if nuevo_estado is not None:
            ok, mensaje = validar_transicion_envio(instance.estado_envio, nuevo_estado)
            if not ok:
                raise serializers.ValidationError({'estado_envio': mensaje})
            validated_data['estado_envio'] = nuevo_estado.strip().lower()
        return super().update(instance, validated_data)


class EnvioEstadoSerializer(serializers.ModelSerializer):
    """CU28 — actualizacion parcial de estado."""

    class Meta:
        model = Envio
        fields = ['estado_envio', 'empresa_transporte']

    def validate_estado_envio(self, valor):
        nuevo = (valor or '').strip().lower()
        if not nuevo:
            raise serializers.ValidationError('El estado es obligatorio.')
        return nuevo

    def validate(self, attrs):
        nuevo_estado = attrs.get('estado_envio')
        if nuevo_estado is not None:
            ok, mensaje = validar_transicion_envio(self.instance.estado_envio, nuevo_estado)
            if not ok:
                raise serializers.ValidationError({'estado_envio': mensaje})
        return attrs
