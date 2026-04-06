from django.db import models
from django.db import transaction
from django.db.models.signals import post_save
from django.dispatch import receiver


class Rol(models.Model):
    id_rol = models.AutoField(primary_key=True)
    nombre_rol = models.CharField(max_length=50)
    descripcion = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.nombre_rol

    class Meta:
        db_table = 'roles'
        verbose_name_plural = 'Roles'


class Categoria(models.Model):
    id_categoria = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True, null=True)
    estado = models.CharField(max_length=20)

    def __str__(self):
        return self.nombre

    class Meta:
        db_table = 'categorias'
        verbose_name_plural = 'Categorías'


class Marca(models.Model):
    id_marca = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=100)
    estado = models.CharField(max_length=20)

    def __str__(self):
        return self.nombre

    class Meta:
        db_table = 'marcas'
        verbose_name_plural = 'Marcas'


class Usuario(models.Model):
    id_usuario = models.AutoField(primary_key=True)
    id_rol = models.ForeignKey(
        Rol,
        on_delete=models.PROTECT,
        db_column='id_rol',
        related_name='usuarios'
    )
    nombre_completo = models.CharField(max_length=150)
    username = models.CharField(max_length=60)
    password_hash = models.CharField(max_length=255)
    estado = models.CharField(max_length=20)
    creado_en = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.nombre_completo

    class Meta:
        db_table = 'usuarios'
        verbose_name_plural = 'Usuarios'


class Cliente(models.Model):
    id_cliente = models.AutoField(primary_key=True)
    nombre_completo = models.CharField(max_length=150)
    telefono = models.CharField(max_length=25, blank=True, null=True)
    ciudad = models.CharField(max_length=100, blank=True, null=True)
    direccion = models.TextField(blank=True, null=True)
    es_top = models.BooleanField(default=False)
    estado = models.CharField(max_length=20)
    creado_en = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.nombre_completo

    class Meta:
        db_table = 'clientes'
        verbose_name_plural = 'Clientes'


class Proveedor(models.Model):
    id_proveedor = models.AutoField(primary_key=True)
    nombre_empresa = models.CharField(max_length=150)
    contacto = models.CharField(max_length=120, blank=True, null=True)
    telefono = models.CharField(max_length=25, blank=True, null=True)
    estado = models.CharField(max_length=20)

    def __str__(self):
        return self.nombre_empresa

    class Meta:
        db_table = 'proveedores'
        verbose_name_plural = 'Proveedores'


class Producto(models.Model):
    id_producto = models.AutoField(primary_key=True)
    id_categoria = models.ForeignKey(
        Categoria,
        on_delete=models.PROTECT,
        db_column='id_categoria',
        related_name='productos'
    )
    id_marca = models.ForeignKey(
        Marca,
        on_delete=models.PROTECT,
        db_column='id_marca',
        related_name='productos'
    )
    nombre = models.CharField(max_length=150)
    descripcion = models.TextField(blank=True, null=True)
    precio_compra = models.DecimalField(max_digits=10, decimal_places=2)
    precio_venta = models.DecimalField(max_digits=10, decimal_places=2)
    atributos = models.JSONField(default=dict)
    estado = models.CharField(max_length=20)
    actualizado_en = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.nombre

    class Meta:
        db_table = 'productos'
        verbose_name_plural = 'Productos'


class Inventario(models.Model):
    id_inventario = models.AutoField(primary_key=True)
    id_producto = models.OneToOneField(
        Producto,
        on_delete=models.PROTECT,
        db_column='id_producto',
        related_name='inventario'
    )
    stock_actual = models.IntegerField(default=0)
    stock_minimo = models.IntegerField(default=0)
    ultima_actualizacion = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'Inventario - {self.id_producto.nombre}'

    class Meta:
        db_table = 'inventario'
        verbose_name_plural = 'Inventarios'


class MovimientoInventario(models.Model):
    id_movimiento = models.AutoField(primary_key=True)
    id_producto = models.ForeignKey(
        Producto,
        on_delete=models.PROTECT,
        db_column='id_producto',
        related_name='movimientos'
    )
    id_usuario = models.ForeignKey(
        Usuario,
        on_delete=models.PROTECT,
        db_column='id_usuario',
        related_name='movimientos_inventario'
    )
    tipo_movimiento = models.CharField(max_length=20)
    cantidad = models.IntegerField()
    fecha_movimiento = models.DateTimeField(auto_now_add=True)
    motivo = models.CharField(max_length=200, blank=True, null=True)

    def __str__(self):
        return f'{self.tipo_movimiento} - {self.id_producto.nombre} ({self.cantidad})'

    class Meta:
        db_table = 'movimientos_inventario'
        verbose_name_plural = 'Movimientos de Inventario'


@receiver(post_save, sender=MovimientoInventario)
def actualizar_stock_por_movimiento(sender, instance, created, **kwargs):
    if not created:
        return

    tipo = (instance.tipo_movimiento or '').strip().lower()
    if tipo not in ('entrada', 'salida'):
        return

    with transaction.atomic():
        inventario = (
            Inventario.objects.select_for_update()
            .filter(id_producto=instance.id_producto)
            .first()
        )

        if inventario is None:
            inventario = Inventario.objects.create(
                id_producto=instance.id_producto,
                stock_actual=0,
                stock_minimo=0,
            )

        if tipo == 'entrada':
            inventario.stock_actual += instance.cantidad
        else:
            inventario.stock_actual -= instance.cantidad

        inventario.save()
