import json
import os
from decimal import Decimal, ROUND_DOWN

from django.db.models import Count, Sum
from django.db.models.functions import Coalesce


LOYALTY_CONFIG_PATH = os.path.join(
    os.path.dirname(__file__),
    'data',
    'loyalty_config.json',
)

DEFAULT_LOYALTY_CONFIG = {
    'points': {
        'enabled': True,
        'amount_per_point': '10.00',
        'label': '1 punto por cada 10 BOB en compras completadas.',
    },
    'levels': [
        {
            'code': 'bronce',
            'name': 'Bronce',
            'min_points': 0,
            'benefits': ['Acceso al programa de lealtad'],
        },
        {
            'code': 'plata',
            'name': 'Plata',
            'min_points': 200,
            'benefits': ['Atencion prioritaria', 'Promociones especiales'],
        },
        {
            'code': 'oro',
            'name': 'Oro',
            'min_points': 500,
            'benefits': ['Promociones premium', 'Acceso prioritario a lanzamientos'],
        },
    ],
    'dynamic_discounts': [
        {'name': 'Compra mayor a 100 BOB', 'min_amount': '100.00', 'percent': '5.00'},
        {'name': 'Compra mayor a 200 BOB', 'min_amount': '200.00', 'percent': '10.00'},
    ],
}

MONEY_QUANTIZER = Decimal('0.01')


def _to_decimal(value, default='0.00'):
    try:
        return Decimal(str(value))
    except Exception:
        return Decimal(str(default))


def _quantize_money(value):
    return _to_decimal(value).quantize(MONEY_QUANTIZER)


def _merge_loyalty_config(raw_config):
    config = {
        'points': dict(DEFAULT_LOYALTY_CONFIG['points']),
        'levels': [],
        'dynamic_discounts': [],
    }

    if isinstance(raw_config, dict):
        points = raw_config.get('points')
        if isinstance(points, dict):
            config['points'].update(points)

        levels = raw_config.get('levels')
        if isinstance(levels, list) and levels:
            config['levels'] = levels

        dynamic_discounts = raw_config.get('dynamic_discounts')
        if isinstance(dynamic_discounts, list):
            config['dynamic_discounts'] = dynamic_discounts

    if not config['levels']:
        config['levels'] = list(DEFAULT_LOYALTY_CONFIG['levels'])
    if not config['dynamic_discounts']:
        config['dynamic_discounts'] = list(DEFAULT_LOYALTY_CONFIG['dynamic_discounts'])

    config['levels'] = sorted(
        [
            {
                'code': str(level.get('code') or 'nivel').strip().lower(),
                'name': str(level.get('name') or 'Nivel').strip(),
                'min_points': max(int(level.get('min_points') or 0), 0),
                'benefits': [str(item).strip() for item in (level.get('benefits') or []) if str(item).strip()],
            }
            for level in config['levels']
        ],
        key=lambda item: item['min_points'],
    )

    config['dynamic_discounts'] = sorted(
        [
            {
                'name': str(rule.get('name') or 'Descuento automatico').strip(),
                'min_amount': str(_quantize_money(rule.get('min_amount') or '0.00')),
                'percent': str(_quantize_money(rule.get('percent') or '0.00')),
            }
            for rule in config['dynamic_discounts']
        ],
        key=lambda item: _to_decimal(item['min_amount']),
    )

    config['points']['enabled'] = bool(config['points'].get('enabled', True))
    config['points']['amount_per_point'] = str(
        max(_to_decimal(config['points'].get('amount_per_point') or '10.00'), Decimal('0.01'))
        .quantize(MONEY_QUANTIZER)
    )
    config['points']['label'] = str(
        config['points'].get('label')
        or DEFAULT_LOYALTY_CONFIG['points']['label']
    ).strip()

    return config


def get_loyalty_config():
    if not os.path.exists(LOYALTY_CONFIG_PATH):
        return _merge_loyalty_config({})

    try:
        with open(LOYALTY_CONFIG_PATH, 'r', encoding='utf-8') as fh:
            raw = json.load(fh)
    except (OSError, json.JSONDecodeError):
        raw = {}
    return _merge_loyalty_config(raw)


def save_loyalty_config(raw_config):
    config = _merge_loyalty_config(raw_config)
    os.makedirs(os.path.dirname(LOYALTY_CONFIG_PATH), exist_ok=True)
    with open(LOYALTY_CONFIG_PATH, 'w', encoding='utf-8') as fh:
        json.dump(config, fh, ensure_ascii=True, indent=2)
    return config


def calculate_points_for_amount(amount, config=None):
    config = config or get_loyalty_config()
    if not config['points'].get('enabled', True):
        return 0
    amount_per_point = _to_decimal(config['points'].get('amount_per_point') or '10.00', '10.00')
    if amount_per_point <= 0:
        amount_per_point = Decimal('10.00')
    total = _to_decimal(amount)
    if total <= 0:
        return 0
    return int((total / amount_per_point).to_integral_value(rounding=ROUND_DOWN))


def resolve_loyalty_level(points, config=None):
    config = config or get_loyalty_config()
    levels = config.get('levels') or []
    current = levels[0] if levels else {
        'code': 'bronce',
        'name': 'Bronce',
        'min_points': 0,
        'benefits': [],
    }
    for level in levels:
        if int(points) >= int(level['min_points']):
            current = level
        else:
            break
    return current


def resolve_next_loyalty_level(points, config=None):
    config = config or get_loyalty_config()
    for level in config.get('levels') or []:
        if int(level['min_points']) > int(points):
            return level
    return None


def calculate_dynamic_discount(amount, config=None):
    config = config or get_loyalty_config()
    subtotal = _quantize_money(amount)
    chosen_rule = None
    for rule in config.get('dynamic_discounts') or []:
        if subtotal >= _to_decimal(rule['min_amount']):
            chosen_rule = rule

    if chosen_rule is None:
        return {
            'applied': False,
            'name': '',
            'percent': '0.00',
            'discount_amount': '0.00',
            'subtotal': str(subtotal),
            'total': str(subtotal),
        }

    percent = _to_decimal(chosen_rule['percent'])
    discount_amount = _quantize_money(subtotal * percent / Decimal('100'))
    total = _quantize_money(subtotal - discount_amount)
    return {
        'applied': discount_amount > 0,
        'name': chosen_rule['name'],
        'percent': str(percent.quantize(MONEY_QUANTIZER)),
        'discount_amount': str(discount_amount),
        'subtotal': str(subtotal),
        'total': str(total),
    }


def build_cliente_loyalty_summary(cliente, projected_amount='0.00', config=None):
    from .models import Venta

    config = config or get_loyalty_config()
    ventas = (
        Venta.objects
        .filter(id_cliente=cliente, estado_venta__iexact='completada')
        .order_by('id_venta')
    )

    total_spent = ventas.aggregate(
        total=Coalesce(Sum('monto_total'), Decimal('0.00')),
        purchases=Count('id_venta'),
    )
    historical_points = sum(
        calculate_points_for_amount(monto, config)
        for monto in ventas.values_list('monto_total', flat=True)
    )

    current_level = resolve_loyalty_level(historical_points, config)
    next_level = resolve_next_loyalty_level(historical_points, config)
    projected_points = calculate_points_for_amount(projected_amount, config)
    points_after_purchase = historical_points + projected_points
    projected_level = resolve_loyalty_level(points_after_purchase, config)

    return {
        'puntos_actuales': historical_points,
        'compras_completadas': int(total_spent['purchases'] or 0),
        'monto_acumulado': str(_quantize_money(total_spent['total'] or '0.00')),
        'nivel_actual': current_level,
        'siguiente_nivel': next_level,
        'faltan_para_siguiente_nivel': (
            max(int(next_level['min_points']) - historical_points, 0)
            if next_level
            else 0
        ),
        'puntos_proyectados_compra': projected_points,
        'puntos_despues_compra': points_after_purchase,
        'nivel_proyectado': projected_level,
        'reglas': config,
    }
