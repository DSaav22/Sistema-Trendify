"""Reglas de negocio logística — Ciclo 5 (CU30–CU32)."""
import random
import string

TARIFA_CONTRAENTREGA_SC = 15
TARIFA_TRANSPORTADORA_INTERIOR = 35

CIUDAD_SANTA_CRUZ_MARKERS = ('santa cruz', 'scz')

PROVEEDORES_VENTA_ONLINE = ('stripe', 'manual_checkout')


def es_santa_cruz(ciudad):
    clave = (ciudad or '').strip().lower()
    return any(m in clave for m in CIUDAD_SANTA_CRUZ_MARKERS)


def tipo_envio_sugerido(ciudad):
    if es_santa_cruz(ciudad):
        return 'contraentrega_sc'
    return 'transportadora_interior'


def calcular_costo_envio(ciudad, tipo_envio):
    tipo = (tipo_envio or '').strip().lower()
    if tipo == 'contraentrega_sc':
        if not es_santa_cruz(ciudad):
            raise ValueError('Contraentrega Santa Cruz solo aplica en Santa Cruz.')
        return TARIFA_CONTRAENTREGA_SC
    if tipo == 'transportadora_interior':
        return TARIFA_TRANSPORTADORA_INTERIOR
    if tipo == 'domicilio':
        return TARIFA_CONTRAENTREGA_SC if es_santa_cruz(ciudad) else TARIFA_TRANSPORTADORA_INTERIOR
    raise ValueError(f'Tipo de envio no soportado: {tipo_envio}')


def generar_codigo_recepcion():
    return ''.join(random.choices(string.digits, k=6))


def es_venta_online(venta):
    """True si la venta tiene transacción de pago de checkout online."""
    return venta.transacciones_pago.filter(
        proveedor__in=PROVEEDORES_VENTA_ONLINE,
    ).exists()


def venta_pago_confirmado(venta):
    """Venta completada con pago online confirmado (CU09 previo a envío)."""
    if (venta.estado_venta or '').strip().lower() != 'completada':
        return False
    if not es_venta_online(venta):
        return False
    return venta.transacciones_pago.filter(
        proveedor__in=PROVEEDORES_VENTA_ONLINE,
        estado_pago__iexact='confirmado',
    ).exists()
