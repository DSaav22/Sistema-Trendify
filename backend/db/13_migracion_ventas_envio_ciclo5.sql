-- 13_migracion_ventas_envio_ciclo5.sql
-- CU30: tipo y costo de envío elegidos en checkout público, persistidos en ventas.

ALTER TABLE ventas ADD COLUMN IF NOT EXISTS tipo_envio VARCHAR(30);
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS costo_envio NUMERIC(10,2);
