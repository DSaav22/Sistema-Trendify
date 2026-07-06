"""Genera bloque INSERT envios para 03_seed.sql (Ciclo 5 logística)."""
from __future__ import annotations

VENTAS_CLIENTE_CIUDAD: dict[int, tuple[int, str]] = {
    1: (2, "Santa Cruz"), 2: (6, "Santa Cruz"), 3: (9, "Santa Cruz"), 4: (2, "Santa Cruz"),
    5: (15, "Santa Cruz"), 6: (3, "Santa Cruz"), 7: (6, "Santa Cruz"), 8: (12, "Santa Cruz"),
    9: (9, "Santa Cruz"), 10: (2, "Santa Cruz"), 11: (16, "Santa Cruz"), 12: (18, "Santa Cruz"),
    13: (7, "Santa Cruz"), 14: (3, "Santa Cruz"), 15: (10, "Santa Cruz"), 16: (4, "La Paz"),
    17: (14, "Santa Cruz"), 18: (6, "Santa Cruz"), 19: (8, "Tarija"), 20: (2, "Santa Cruz"),
    21: (16, "Santa Cruz"), 22: (3, "Santa Cruz"), 23: (9, "Santa Cruz"), 24: (11, "Montero"),
    25: (5, "Cochabamba"), 26: (17, "Santa Cruz"), 27: (12, "Santa Cruz"), 28: (1, "Santa Cruz"),
    29: (15, "Santa Cruz"), 30: (18, "Santa Cruz"), 31: (2, "Santa Cruz"), 32: (6, "Santa Cruz"),
    33: (16, "Santa Cruz"), 34: (18, "Santa Cruz"), 35: (9, "Santa Cruz"), 36: (3, "Santa Cruz"),
    37: (7, "Santa Cruz"), 38: (2, "Santa Cruz"), 39: (10, "Santa Cruz"), 40: (14, "Santa Cruz"),
    41: (16, "Santa Cruz"), 42: (3, "Santa Cruz"), 43: (17, "Santa Cruz"), 44: (6, "Santa Cruz"),
    45: (18, "Santa Cruz"), 46: (2, "Santa Cruz"), 47: (6, "Santa Cruz"), 48: (16, "Santa Cruz"),
    49: (3, "Santa Cruz"), 50: (9, "Santa Cruz"), 51: (18, "Santa Cruz"), 52: (7, "Santa Cruz"),
    53: (10, "Santa Cruz"), 54: (16, "Santa Cruz"), 55: (17, "Santa Cruz"), 56: (19, "La Paz"),
    57: (20, "Cochabamba"),
}

VENTAS_ESTADO: dict[int, str] = {
    **{i: "completada" for i in range(1, 33)},
    33: "pendiente_verificacion",
    34: "pendiente_verificacion",
    35: "completada",
    36: "completada",
    37: "pendiente_verificacion",
    38: "pendiente_verificacion",
    39: "completada",
    40: "completada",
    41: "pendiente_verificacion",
    42: "pendiente_verificacion",
    43: "completada",
    44: "completada",
    45: "pendiente_verificacion",
    46: "completada",
    47: "completada",
    48: "completada",
    49: "completada",
    50: "completada",
    51: "pendiente_verificacion",
    52: "pendiente_verificacion",
    53: "completada",
    54: "pendiente_validacion",
    55: "pendiente_validacion",
    56: "pendiente_validacion",
    57: "pendiente_validacion",
}

# Ventas completadas sin envío — demo CU27 (crear envío en panel logística)
SIN_ENVIO_CU27 = {46, 48, 50, 53}

# Escenarios fijos documentados en comentarios del seed
ESPECIAL: dict[int, tuple[str, bool, str | None, str | None]] = {
    1: ("entregado", True, "111222", "Maria Delivery"),       # CU32 ya confirmado
    2: ("en_camino", False, "482916", "Juan Mensajero"),       # CU29/CU32 demo Gabriela 70010002
    4: ("entregado", True, "334455", "Trendify Delivery SCZ"),
    9: ("en_camino", False, "591203", "Juan Mensajero"),       # CU32 demo Florencia 70010009
    16: ("preparando", False, None, None),                     # Interior La Paz — CU30 tarifa 35
}

TRANSPORTADORAS_INT = ["Transporte Interior BO", "Expreso Bus", "Flota Bolivar"]
TRANSPORTADORAS_SC = ["Trendify Delivery SCZ", "RapidGo Santa Cruz", "FlashCourier"]


def main() -> None:
    id_envio = 0
    rows: list[str] = []
    for id_venta in range(1, 58):
        if VENTAS_ESTADO.get(id_venta) != "completada":
            continue
        if id_venta in SIN_ENVIO_CU27:
            continue
        id_envio += 1
        _cid, ciudad = VENTAS_CLIENTE_CIUDAD[id_venta]
        sc = ciudad.strip().lower() == "santa cruz"
        tipo = "contraentrega_sc" if sc else "transportadora_interior"
        costo = 15.00 if sc else 35.00
        emp = TRANSPORTADORAS_SC[id_envio % 3] if sc else TRANSPORTADORAS_INT[id_envio % 3]
        if id_venta in ESPECIAL:
            est, conf, cod, rep = ESPECIAL[id_venta]
        else:
            ciclo = id_venta % 5
            if ciclo == 0:
                est, conf, cod, rep = "entregado", id_venta % 3 == 0, f"{100000 + id_venta}"[-6:], (
                    "Maria Delivery" if sc else None
                )
            elif ciclo == 1:
                est, conf, cod, rep = "en_camino", False, f"{200000 + id_venta}"[-6:], (
                    "Juan Mensajero" if sc else None
                )
            elif ciclo == 2:
                est, conf, cod, rep = "preparando", False, None, None
            elif ciclo == 3:
                est, conf, cod, rep = "entregado", False, f"{300000 + id_venta}"[-6:], None
            else:
                est, conf, cod, rep = "cancelado", False, None, None
        if est == "en_camino" and not cod:
            cod = f"{400000 + id_venta}"[-6:]
        if est == "entregado" and conf and not cod:
            cod = f"{500000 + id_venta}"[-6:]
        rep_sql = "NULL" if not rep else f"'{rep}'"
        cod_sql = "NULL" if not cod else f"'{cod}'"
        conf_sql = "TRUE" if conf else "FALSE"
        rows.append(
            f"({id_envio}, {id_venta}, '{tipo}', '{emp}', '{est}', "
            f"{costo:.2f}, {rep_sql}, {cod_sql}, {conf_sql})"
        )

    print(
        "-- Envíos Ciclo 5: contraentrega_sc (Bs 15) / transportadora_interior (Bs 35)\n"
        "-- Demo CU27: ventas 46, 48, 50, 53 completadas SIN envío\n"
        "-- Demo CU29: venta #2 tel. 70010002 | CU32: venta #9 tel. 70010009 código 591203\n"
        "INSERT INTO envios (id_envio, id_venta, tipo_envio, empresa_transporte, "
        "estado_envio, costo_envio, repartidor, codigo_recepcion, recepcion_confirmada) VALUES"
    )
    print(",\n".join(rows) + ";")


if __name__ == "__main__":
    main()
