import { useEffect, useMemo, useState } from 'react';

import api from '../utils/api';

const CLIENTES_URL = '/api/clientes/';
const PRODUCTOS_URL = '/api/productos/';
const INVENTARIO_URL = '/api/inventario/';
const VENTAS_URL = '/api/ventas/';

function normalizeList(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  return [];
}

function formatCurrency(value) {
  const amount = Number(value || 0);
  return amount.toLocaleString('es-BO', {
    style: 'currency',
    currency: 'BOB',
    minimumFractionDigits: 2,
  });
}

export default function CajaManager() {
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [stockPorProducto, setStockPorProducto] = useState({});

  const [idCliente, setIdCliente] = useState('');
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [carrito, setCarrito] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const totalVenta = useMemo(
    () => carrito.reduce((acc, item) => acc + item.cantidad * Number(item.precio_unitario), 0),
    [carrito]
  );

  const cargarDatos = async () => {
    setLoading(true);
    setError('');

    try {
      const [clientesResponse, productosResponse, inventarioResponse] = await Promise.all([
        api.get(CLIENTES_URL),
        api.get(PRODUCTOS_URL),
        api.get(INVENTARIO_URL),
      ]);

      const clientesData = normalizeList(clientesResponse.data);
      const productosData = normalizeList(productosResponse.data);
      const inventarioData = normalizeList(inventarioResponse.data);

      const mapaStock = {};
      inventarioData.forEach((item) => {
        const idProducto = Number(item.id_producto?.id_producto ?? item.id_producto);
        mapaStock[idProducto] = Number(item.stock_actual ?? 0);
      });

      setClientes(clientesData);
      setProductos(productosData);
      setStockPorProducto(mapaStock);
    } catch (err) {
      console.error('Error cargando datos de caja:', err);
      setError('No se pudieron cargar clientes/productos/inventario.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const agregarAlCarrito = (producto) => {
    setError('');
    setSuccess('');

    const idProducto = Number(producto.id_producto ?? producto.id);
    const stockDisponible = Number(stockPorProducto[idProducto] ?? 0);

    if (stockDisponible <= 0) {
      setError('Este producto no tiene stock disponible.');
      return;
    }

    setCarrito((prev) => {
      const existe = prev.find((item) => item.id_producto === idProducto);
      if (!existe) {
        return [
          ...prev,
          {
            id_producto: idProducto,
            nombre: producto.nombre,
            cantidad: 1,
            precio_unitario: Number(producto.precio_venta),
          },
        ];
      }

      if (existe.cantidad + 1 > stockDisponible) {
        setError(`Stock insuficiente para ${producto.nombre}.`);
        return prev;
      }

      return prev.map((item) =>
        item.id_producto === idProducto ? { ...item, cantidad: item.cantidad + 1 } : item
      );
    });
  };

  const eliminarDelCarrito = (idProducto) => {
    setCarrito((prev) => prev.filter((item) => item.id_producto !== idProducto));
  };

  const registrarVenta = async () => {
    setError('');
    setSuccess('');

    if (!idCliente) {
      setError('Selecciona un cliente para registrar la venta.');
      return;
    }

    if (carrito.length === 0) {
      setError('Agrega al menos un producto al carrito.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        id_cliente: Number(idCliente),
        metodo_pago: metodoPago,
        estado_venta: 'completada',
        detalles: carrito.map((item) => ({
          id_producto: item.id_producto,
          cantidad: item.cantidad,
        })),
      };

      const { data } = await api.post(VENTAS_URL, payload);
      setSuccess(`Venta #${data.id_venta} registrada correctamente.`);
      setCarrito([]);
      await cargarDatos();
    } catch (err) {
      console.error('Error registrando venta:', err);
      setError(err?.response?.data?.detail || 'No se pudo registrar la venta.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-[1500px]">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Caja / Ventas</h2>
        <p className="mt-1 text-sm text-slate-500">Registra ventas y descuenta inventario automaticamente.</p>
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {success && (
        <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-slate-800">Carrito y Checkout</h3>

          <div className="grid gap-3 md:grid-cols-2">
            <select
              value={idCliente}
              onChange={(e) => setIdCliente(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none transition focus:border-sky-500"
            >
              <option value="">Selecciona cliente</option>
              {clientes.map((cliente) => {
                const id = cliente.id_cliente ?? cliente.id;
                return (
                  <option key={id} value={id}>
                    {cliente.nombre_completo}
                  </option>
                );
              })}
            </select>

            <select
              value={metodoPago}
              onChange={(e) => setMetodoPago(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none transition focus:border-sky-500"
            >
              <option value="efectivo">Efectivo</option>
              <option value="qr">QR</option>
              <option value="transferencia">Transferencia</option>
              <option value="tarjeta">Tarjeta</option>
            </select>
          </div>

          <div className="mt-5 overflow-x-auto max-w-full rounded-xl border border-slate-200">
            <table className="min-w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-700">
                <tr>
                  <th className="px-4 py-3 font-semibold">Producto</th>
                  <th className="px-4 py-3 font-semibold">Cantidad</th>
                  <th className="px-4 py-3 font-semibold">Subtotal</th>
                  <th className="px-4 py-3 font-semibold">Accion</th>
                </tr>
              </thead>
              <tbody>
                {carrito.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                      El carrito esta vacio.
                    </td>
                  </tr>
                ) : (
                  carrito.map((item) => (
                    <tr key={item.id_producto} className="border-t border-slate-100">
                      <td className="px-4 py-3 text-slate-700">{item.nombre}</td>
                      <td className="px-4 py-3 text-slate-700">{item.cantidad}</td>
                      <td className="px-4 py-3 text-slate-700">
                        {formatCurrency(item.cantidad * Number(item.precio_unitario))}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => eliminarDelCarrito(item.id_producto)}
                          className="rounded-md bg-red-600 px-3 py-1.5 text-white transition hover:bg-red-700"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-5 rounded-xl bg-slate-900 px-5 py-4 text-white">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-300">Total</p>
            <p className="mt-1 text-3xl font-bold">{formatCurrency(totalVenta)}</p>

            <button
              type="button"
              onClick={registrarVenta}
              disabled={saving || loading}
              className="mt-4 w-full rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Registrando venta...' : 'Registrar Venta'}
            </button>
          </div>
        </article>

        <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-slate-800">Catalogo de Productos</h3>

          {loading ? (
            <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              Cargando catalogo...
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {productos.map((producto) => {
                const id = Number(producto.id_producto ?? producto.id);
                const stock = Number(stockPorProducto[id] ?? 0);

                return (
                  <div key={id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="font-semibold text-slate-800">{producto.nombre}</p>
                    <p className="mt-1 text-sm text-slate-500">Precio: {formatCurrency(producto.precio_venta)}</p>
                    <p className="text-sm text-slate-500">Stock: {stock}</p>

                    <button
                      type="button"
                      onClick={() => agregarAlCarrito(producto)}
                      disabled={stock <= 0}
                      className="mt-3 w-full rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      + Agregar al Carrito
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </article>
      </div>
    </section>
  );
}
