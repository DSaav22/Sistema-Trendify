-- ============================================================
-- 03_seed.sql
-- Datos de prueba (5 registros por tabla)
-- ============================================================

INSERT INTO roles (id_rol, nombre_rol, descripcion) VALUES
(1, 'Administrador', 'Acceso total a configuracion, catalogos y reportes.'),
(2, 'Vendedor', 'Gestion de ventas, clientes y consulta de inventario.'),
(3, 'Bodeguero', 'Control de existencias, entradas y salidas de inventario.'),
(4, 'Compras', 'Registro y seguimiento de compras a proveedores.'),
(5, 'Auditor', 'Consulta de bitacora y validacion de movimientos.'),
(6, 'Cliente', 'Cliente final que compra en la tienda online.');

INSERT INTO categorias (id_categoria, nombre, descripcion, estado) VALUES
(1, 'Maquillaje', 'Productos para rostro, ojos y labios.', 'activo'),
(2, 'Cuidado Facial', 'Limpieza, hidratacion y tratamiento del rostro.', 'activo'),
(3, 'Cuidado Capilar', 'Shampoo, mascarillas y tratamientos para cabello.', 'activo'),
(4, 'Fragancias', 'Perfumes y body mists para uso diario.', 'activo'),
(5, 'Accesorios', 'Brochas, esponjas y herramientas de belleza.', 'activo');

INSERT INTO marcas (id_marca, nombre, estado) VALUES
(1, 'LuxeGlow', 'activo'),
(2, 'Dermabelle', 'activo'),
(3, 'CapilCare Pro', 'activo'),
(4, 'AromaViva', 'activo'),
(5, 'BeautyTools MX', 'activo');

INSERT INTO usuarios (id_usuario, id_rol, nombre_completo, username, password_hash, estado, creado_en) VALUES
(1, 1, 'Sofia Martinez', 'smartinez', '$2b$12$hA6cP3L9XQJ4kVxW1dN5VeP8Qn0fR7xY3uJ2iM9tC6aZ1wL8dKpOe', 'activo', '2026-01-10 08:30:00'),
(2, 2, 'Diego Alvarez', 'dalvarez', '$2b$12$qW8kLm2N5vJ1xP0sD4rTYeC7nH3uB9aF5mZ6pR2tY1wX8vK4sD3lQ', 'activo', '2026-01-11 09:15:00'),
(3, 3, 'Valeria Torres', 'vtorres', '$2b$12$zX4nM7qP2sL9vD6kA1rTYeC8uH3jB5fN0mW2pR7tY4xK9vC6sD1aE', 'activo', '2026-01-12 10:05:00'),
(4, 4, 'Ricardo Paredes', 'rparedes', '$2b$12$uC7mP1xN4vK8sD2lQ9rTYeA5nH3jB6fZ0wW2pR8tY4xL1vC6sD9kM', 'activo', '2026-01-13 11:20:00'),
(5, 5, 'Ana Lucero', 'alucero', '$2b$12$mN3qP8xL1vK4sD7aE2rTYeC9nH5jB6fZ0wW2pR1tY8xC4vL6sD3kQ', 'activo', '2026-01-14 14:45:00');

INSERT INTO clientes (id_cliente, nombre_completo, telefono, ciudad, direccion, es_top, estado, creado_en) VALUES
(1, 'Camila Rojas', '+593998001001', 'Quito', 'Av. Republica del Salvador N34-120 y Moscu', TRUE, 'activo', '2026-01-20 16:10:00'),
(2, 'Mariana Cevallos', '+593998001002', 'Guayaquil', 'Urdesa Central, Calle 3ra #210', FALSE, 'activo', '2026-01-21 11:25:00'),
(3, 'Paola Herrera', '+593998001003', 'Cuenca', 'Av. Solano 4-55 y Remigio Crespo', TRUE, 'activo', '2026-01-22 09:40:00'),
(4, 'Daniela Ochoa', '+593998001004', 'Ambato', 'Av. Cevallos y Mera, Edif. Altamira, piso 2', FALSE, 'activo', '2026-01-23 13:05:00'),
(5, 'Andrea Mena', '+593998001005', 'Loja', 'Barrio San Sebastian, Calle Bolivar 18-45', FALSE, 'activo', '2026-01-24 17:30:00');

INSERT INTO proveedores (id_proveedor, nombre_empresa, contacto, telefono, estado) VALUES
(1, 'Distribuidora Belleza Andina S.A.', 'Luis Cardenas', '+59322345001', 'activo'),
(2, 'Importadora Dermacosmetica EC', 'Karen Ponce', '+59322345002', 'activo'),
(3, 'Capilar Supply Group', 'Miguel Vizuete', '+59322345003', 'activo'),
(4, 'Fragancias Premium LATAM', 'Natalia Vela', '+59322345004', 'activo'),
(5, 'Tools & Brushes Ecuador', 'Esteban Arce', '+59322345005', 'activo');

INSERT INTO productos (
    id_producto, id_categoria, id_marca, nombre, descripcion,
    precio_compra, precio_venta, atributos, estado, actualizado_en
) VALUES
(1, 1, 1, 'Base Liquida HD 30ml', 'Base de cobertura media-alta con acabado natural.',
 12.50, 24.90, '{"tono":"beige medio","tipo_piel":"mixta","acabado":"natural","contenido_ml":30}', 'activo', '2026-02-01 10:00:00'),
(2, 2, 2, 'Serum Vitamina C 20%', 'Serum antioxidante para iluminar y unificar tono.',
 9.80, 19.90, '{"concentracion":"20%","tipo_piel":"todo tipo","contenido_ml":30}', 'activo', '2026-02-01 10:05:00'),
(3, 3, 3, 'Shampoo Reparador Keratina 400ml', 'Limpieza suave con reparacion para cabello danado.',
 7.20, 14.50, '{"sin_sulfatos":true,"contenido_ml":400,"tipo_cabello":"danado"}', 'activo', '2026-02-01 10:10:00'),
(4, 4, 4, 'Eau de Parfum Floral 50ml', 'Fragancia floral dulce para uso diario.',
 15.00, 32.00, '{"familia_olfativa":"floral","genero":"femenino","contenido_ml":50}', 'activo', '2026-02-01 10:15:00'),
(5, 5, 5, 'Set Brochas Profesional x10', 'Set de brochas sinteticas para maquillaje completo.',
 11.00, 22.50, '{"cantidad_piezas":10,"material":"fibra sintetica","incluye_estuche":true}', 'activo', '2026-02-01 10:20:00');

INSERT INTO inventario (id_inventario, id_producto, stock_actual, stock_minimo, ultima_actualizacion) VALUES
(1, 1, 85, 20, '2026-02-10 09:00:00'),
(2, 2, 60, 15, '2026-02-10 09:02:00'),
(3, 3, 110, 25, '2026-02-10 09:04:00'),
(4, 4, 45, 10, '2026-02-10 09:06:00'),
(5, 5, 70, 18, '2026-02-10 09:08:00');

INSERT INTO movimientos_inventario (
    id_movimiento, id_producto, id_usuario, tipo_movimiento, cantidad, fecha_movimiento, motivo
) VALUES
(1, 1, 3, 'entrada', 40, '2026-02-10 08:30:00', 'Ingreso por compra lote BLHD-2602'),
(2, 2, 3, 'entrada', 30, '2026-02-10 08:35:00', 'Ingreso por compra lote SVC-2602'),
(3, 3, 3, 'salida', 5,  '2026-02-11 12:10:00', 'Ajuste por producto danado'),
(4, 4, 2, 'salida', 3,  '2026-02-11 18:45:00', 'Venta mostrador ticket V-0004'),
(5, 5, 3, 'entrada', 20, '2026-02-12 09:20:00', 'Reposicion semanal de accesorios');

INSERT INTO compras (id_compra, id_proveedor, id_usuario, fecha_compra, monto_total, estado_compra) VALUES
(1, 1, 4, '2026-02-05 10:00:00', 500.00, 'recibida'),
(2, 2, 4, '2026-02-06 11:30:00', 294.00, 'recibida'),
(3, 3, 4, '2026-02-07 15:20:00', 360.00, 'recibida'),
(4, 4, 4, '2026-02-08 16:45:00', 450.00, 'recibida'),
(5, 5, 4, '2026-02-09 09:10:00', 330.00, 'recibida');

INSERT INTO detalles_compra (
    id_detalle_compra, id_compra, id_producto, lote, fecha_vencimiento, cantidad, precio_unitario, subtotal
) VALUES
(1, 1, 1, 'BLHD-2602-A', '2028-02-28', 40, 12.50, 500.00),
(2, 2, 2, 'SVC-2602-B',  '2027-12-31', 30, 9.80, 294.00),
(3, 3, 3, 'SKR-2602-C',  '2028-06-30', 50, 7.20, 360.00),
(4, 4, 4, 'EFP-2602-D',  '2029-01-31', 30, 15.00, 450.00),
(5, 5, 5, 'SBP-2602-E',  '2030-12-31', 30, 11.00, 330.00);

INSERT INTO ventas (
    id_venta, id_cliente, id_usuario, fecha_hora, monto_total, metodo_pago, estado_venta
) VALUES
(1, 1, 2, '2026-02-12 10:15:00', 49.80, 'tarjeta', 'completada'),
(2, 2, 2, '2026-02-12 12:40:00', 39.80, 'efectivo', 'completada'),
(3, 3, 2, '2026-02-12 15:05:00', 29.00, 'transferencia', 'completada'),
(4, 4, 2, '2026-02-12 17:25:00', 32.00, 'tarjeta', 'completada'),
(5, 5, 2, '2026-02-12 19:10:00', 45.00, 'efectivo', 'completada');

INSERT INTO detalles_venta (
    id_detalle_venta, id_venta, id_producto, cantidad, precio_unitario, subtotal
) VALUES
(1, 1, 1, 2, 24.90, 49.80),
(2, 2, 2, 2, 19.90, 39.80),
(3, 3, 3, 2, 14.50, 29.00),
(4, 4, 4, 1, 32.00, 32.00),
(5, 5, 5, 2, 22.50, 45.00);

INSERT INTO envios (id_envio, id_venta, tipo_envio, empresa_transporte, estado_envio) VALUES
(1, 1, 'domicilio', 'ServiExpress', 'entregado'),
(2, 2, 'domicilio', 'RapidGo', 'en_ruta'),
(3, 3, 'retiro_tienda', 'N/A', 'listo_retiro'),
(4, 4, 'domicilio', 'ServiExpress', 'despachado'),
(5, 5, 'domicilio', 'FlashCourier', 'procesando');

INSERT INTO bitacora (
    id_bitacora, id_usuario, accion, tabla_afectada, registro_afectado_id, detalle, fecha_hora, direccion_ip
) VALUES
(1, 1, 'INSERT', 'usuarios', 5, 'Alta de usuario auditor: alucero', '2026-01-14 14:46:10', '192.168.10.11'),
(2, 4, 'INSERT', 'compras', 5, 'Registro de compra al proveedor Tools & Brushes Ecuador', '2026-02-09 09:12:44', '192.168.10.24'),
(3, 3, 'UPDATE', 'inventario', 3, 'Ajuste de stock por merma de 5 unidades', '2026-02-11 12:12:09', '192.168.10.18'),
(4, 2, 'INSERT', 'ventas', 4, 'Venta completada para cliente Daniela Ochoa', '2026-02-12 17:26:51', '192.168.10.15'),
(5, 1, 'INSERT', 'movimientos_inventario', 5, 'Entrada por reposicion semanal de accesorios', '2026-02-12 09:21:33', '192.168.10.11');

-- Ajuste de secuencias por carga manual de IDs
SELECT setval(pg_get_serial_sequence('roles', 'id_rol'), (SELECT MAX(id_rol) FROM roles));
SELECT setval(pg_get_serial_sequence('categorias', 'id_categoria'), (SELECT MAX(id_categoria) FROM categorias));
SELECT setval(pg_get_serial_sequence('marcas', 'id_marca'), (SELECT MAX(id_marca) FROM marcas));
SELECT setval(pg_get_serial_sequence('usuarios', 'id_usuario'), (SELECT MAX(id_usuario) FROM usuarios));
SELECT setval(pg_get_serial_sequence('clientes', 'id_cliente'), (SELECT MAX(id_cliente) FROM clientes));
SELECT setval(pg_get_serial_sequence('proveedores', 'id_proveedor'), (SELECT MAX(id_proveedor) FROM proveedores));
SELECT setval(pg_get_serial_sequence('productos', 'id_producto'), (SELECT MAX(id_producto) FROM productos));
SELECT setval(pg_get_serial_sequence('inventario', 'id_inventario'), (SELECT MAX(id_inventario) FROM inventario));
SELECT setval(pg_get_serial_sequence('movimientos_inventario', 'id_movimiento'), (SELECT MAX(id_movimiento) FROM movimientos_inventario));
SELECT setval(pg_get_serial_sequence('compras', 'id_compra'), (SELECT MAX(id_compra) FROM compras));
SELECT setval(pg_get_serial_sequence('detalles_compra', 'id_detalle_compra'), (SELECT MAX(id_detalle_compra) FROM detalles_compra));
SELECT setval(pg_get_serial_sequence('ventas', 'id_venta'), (SELECT MAX(id_venta) FROM ventas));
SELECT setval(pg_get_serial_sequence('detalles_venta', 'id_detalle_venta'), (SELECT MAX(id_detalle_venta) FROM detalles_venta));
SELECT setval(pg_get_serial_sequence('envios', 'id_envio'), (SELECT MAX(id_envio) FROM envios));
SELECT setval(pg_get_serial_sequence('bitacora', 'id_bitacora'), (SELECT MAX(id_bitacora) FROM bitacora));
