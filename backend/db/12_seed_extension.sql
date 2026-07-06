-- ============================================================
-- 12_seed_extension.sql
-- Datos demo que dependen de tablas creadas en migraciones 08 y 09.
-- Se ejecuta despues de 08_migracion_pedidos_guardados y 09_migracion_pago_transacciones.
-- ============================================================

TRUNCATE detalles_pedido_guardado, pedidos_guardados, pagos_transacciones RESTART IDENTITY CASCADE;

-- Carritos / pedidos guardados (CU19 — clientes online)
INSERT INTO pedidos_guardados (id_pedido_guardado, id_cliente, nombre, creado_en, actualizado_en) VALUES
(1, 16, 'Mi rutina K-Beauty', '2026-06-18 10:00:00', '2026-06-20 14:30:00'),
(2, 18, 'Regalo cumpleanos', '2026-06-19 16:45:00', '2026-06-21 09:15:00'),
(3, 17, 'Reposicion serum', '2026-06-22 08:00:00', '2026-06-22 08:00:00');

INSERT INTO detalles_pedido_guardado (id_detalle_pedido_guardado, id_pedido_guardado, id_producto, cantidad) VALUES
(1, 1, 1, 1),
(2, 1, 3, 1),
(3, 1, 6, 2),
(4, 2, 11, 1),
(5, 2, 12, 1),
(6, 2, 15, 2),
(7, 3, 2, 1),
(8, 3, 4, 1);

-- Trazabilidad de pagos (CU09 / checkout online)
INSERT INTO pagos_transacciones (
    id_pago_transaccion, id_venta, proveedor, estado_pago, monto, moneda,
    id_transaccion_externa, idempotency_key, detalle, creado_en, actualizado_en
) VALUES
(1, 33, 'manual', 'pendiente', 106.00, 'BOB', NULL, 'seed-tx-033', 'Transferencia pendiente verificacion operador', '2026-06-04 13:05:00', '2026-06-04 13:05:00'),
(2, 34, 'qr_banco', 'pendiente', 113.00, 'BOB', 'QR-0622-034', 'seed-tx-034', 'QR escaneado — espera confirmacion bancaria', '2026-06-05 14:10:00', '2026-06-05 14:10:00'),
(3, 51, 'manual', 'pendiente', 137.00, 'BOB', 'TXN-0622-006', 'seed-tx-051', 'Transferencia mostrador Paola Herrera', '2026-06-22 14:20:00', '2026-06-22 14:20:00'),
(4, 52, 'qr_banco', 'pendiente', 72.00, 'BOB', 'TXN-0622-007', 'seed-tx-052', 'Pago QR Isabella Cruz', '2026-06-22 15:35:00', '2026-06-22 15:35:00'),
(5, 54, 'tienda_online', 'pendiente', 113.00, 'BOB', 'WEB-0622-001', 'seed-web-054', 'Pedido online Camila Rojas — QR', '2026-06-22 18:35:00', '2026-06-22 18:35:00'),
(6, 55, 'tienda_online', 'pendiente', 92.00, 'BOB', 'WEB-0622-002', 'seed-web-055', 'Pedido online Mariana Cevallos — transferencia', '2026-06-22 19:35:00', '2026-06-22 19:35:00'),
(7, 56, 'tienda_online', 'pendiente', 88.00, 'BOB', 'WEB-0622-003', 'seed-web-056', 'Pedido online Daniela Ochoa La Paz — interior', '2026-06-22 20:35:00', '2026-06-22 20:35:00'),
(8, 57, 'tienda_online', 'pendiente', 200.00, 'BOB', 'WEB-0622-004', 'seed-web-057', 'Pedido online Andrea Mena Cochabamba — interior', '2026-06-22 21:35:00', '2026-06-22 21:35:00'),
(9, 1, 'manual', 'confirmado', 157.00, 'BOB', NULL, 'seed-tx-001', 'Venta tarjeta confirmada al instante', '2026-03-05 10:05:00', '2026-03-05 10:05:00'),
(10, 2, 'manual', 'confirmado', 122.00, 'BOB', NULL, 'seed-tx-002', 'Efectivo contraentrega registrado', '2026-03-08 11:05:00', '2026-03-08 11:05:00');

SELECT setval(pg_get_serial_sequence('pedidos_guardados', 'id_pedido_guardado'), (SELECT MAX(id_pedido_guardado) FROM pedidos_guardados));
SELECT setval(pg_get_serial_sequence('detalles_pedido_guardado', 'id_detalle_pedido_guardado'), (SELECT MAX(id_detalle_pedido_guardado) FROM detalles_pedido_guardado));
SELECT setval(pg_get_serial_sequence('pagos_transacciones', 'id_pago_transaccion'), (SELECT MAX(id_pago_transaccion) FROM pagos_transacciones));
