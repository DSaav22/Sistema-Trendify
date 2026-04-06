from rest_framework import serializers

# Importa los modelos desde models.py de la app catalogos.
from .models import (
    Categoria,
    Cliente,
    Inventario,
    Marca,
    MovimientoInventario,
    Producto,
    Proveedor,
    Rol,
    Usuario,
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


class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = '__all__'


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
