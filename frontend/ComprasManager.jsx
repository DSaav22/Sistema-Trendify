import { useEffect, useMemo, useState } from 'react';
import api from './src/utils/api';

const PROVEEDORES_URL = '/api/proveedores/';
const PRODUCTOS_URL = '/api/productos/';
const COMPRAS_URL = '/api/compras/';

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

export default function ComprasManager() {
  const [proveedores, setProveedores] = useState([]);
  const [productos, setProductos] = useState([]);
  const [comprasPrevias, setComprasPrevias] = useState([]);

  const [idProveedor, setIdProveedor] = useState('');
  const [items, setItems] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const totalCompra = useMemo(
    () =>
      items.reduce(
        (acc, item) => acc + Number(item.cantidad || 0) * Number(item.precio_unitario || 0),
        0
      ),
    [items]
  );

  const cargarDatos = async () => {
    setLoading(true);
    setError('');
    try {
      const [provResp, prodResp, comprasResp] = await Promise.all([
        api.get(PROVEEDORES_URL),
        api.get(PRODUCTOS_URL),
        api.get(COMPRAS_URL),
      ]);
      setProveedores(normalizeList(provResp.data).filter((p) => (p.estado || '').toLowerCase() === 'activo'));
      setProductos(normalizeList(prodResp.data));
      setComprasPrevias(normalizeList(comprasResp.data).slice(0, 10));
    } catch (err) {
      console.error('Error cargando datos de compras:', err);
      setError('No se pudieron cargar proveedores/productos/compras.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const agregarItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id_producto: '',
        cantidad: 1,
        precio_unitario: '',
        lote: '',
        fecha_vencimiento: '',
      },
    ]);
  };

  const actualizarItem = (index, campo, valor) => {
    setItems((prev) =>
      prev.map((it, i) => {
        if (i !== index) return it;
        const next = { ...it, [campo]: valor };
        if (campo === 'id_producto' && valor) {
          const prod = productos.find((p) => Number(p.id_producto) === Number(valor));
          if (prod && !it.precio_unitario) {
            next.precio_unitario = Number(prod.precio_compra) || '';
          }
        }
        return next;
      })
    );
  };

  const eliminarItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const registrarCompra = async () => {
    setError('');
    setSuccess('');

    if (!idProveedor) {
      setError('Selecciona un proveedor.');
      return;
    }

    if (items.length === 0) {
      setError('Agrega al menos un item a la compra.');
      return;
    }

    for (const it of items) {
      if (!it.id_producto) {
        setError('Cada item debe tener un producto seleccionado.');
        return;
      }
      if (!it.cantidad || Number(it.cantidad) <= 0) {
        setError('La cantidad de cada item debe ser mayor a cero.');
        return;
      }
      if (it.precio_unitario === '' || Number(it.precio_unitario) < 0) {
        setError('El precio unitario de cada item debe ser >= 0.');
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        id_proveedor: Number(idProveedor),
        estado_compra: 'completada',
        detalles: items.map((it) => ({
          id_producto: Number(it.id_producto),
          cantidad: Number(it.cantidad),
          precio_unitario: Number(it.precio_unitario),
          lote: it.lote || null,
          fecha_vencimiento: it.fecha_vencimiento || null,
        })),
      };

      const { data } = await api.post(COMPRAS_URL, payload);
      setSuccess(`Compra #${data.id_compra} registrada por ${formatCurrency(data.monto_total)}.`);
      setItems([]);
      setIdProveedor('');
      await cargarDatos();
    } catch (err) {
      console.error('Error registrando compra:', err);
      setError(err?.response?.data?.detail || 'No se pudo registrar la compra.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-[1500px]">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Compras / Ingreso de Productos</h2>
        <p className="mt-1 text-sm text-slate-500">
          Registra ingresos de stock por compras a proveedores. El inventario se incrementa automaticamente.
        </p>
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      {success && (
        <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {success}
        </p>
      )}

      <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-slate-800">Nueva Compra</h3>

        <div className="mb-5">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
            Proveedor
          </label>
          <select
            value={idProveedor}
            onChange={(e) => setIdProveedor(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none transition focus:border-sky-500"
          >
            <option value="">Selecciona un proveedor activo</option>
            {proveedores.map((p) => (
              <option key={p.id_proveedor} value={p.id_proveedor}>
                {p.nombre_empresa}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-600">Items</h4>
          <button
            type="button"
            onClick={agregarItem}
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            + Agregar item
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="px-3 py-2 font-semibold">Producto</th>
                <th className="px-3 py-2 font-semibold">Cantidad</th>
                <th className="px-3 py-2 font-semibold">Precio compra</th>
                <th className="px-3 py-2 font-semibold">Lote</th>
                <th className="px-3 py-2 font-semibold">Vencimiento</th>
                <th className="px-3 py-2 font-semibold">Subtotal</th>
                <th className="px-3 py-2 font-semibold">Accion</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-slate-500">
                    No hay items. Agrega al menos uno.
                  </td>
                </tr>
              ) : (
                items.map((it, i) => {
                  const subtotal = Number(it.cantidad || 0) * Number(it.precio_unitario || 0);
                  return (
                    <tr key={i} className="border-t border-slate-100 align-top">
                      <td className="px-3 py-2">
                        <select
                          value={it.id_producto}
                          onChange={(e) => actualizarItem(i, 'id_producto', e.target.value)}
                          className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm"
                        >
                          <option value="">Selecciona</option>
                          {productos.map((p) => (
                            <option key={p.id_producto} value={p.id_producto}>
                              {p.nombre}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min={1}
                          value={it.cantidad}
                          onChange={(e) => actualizarItem(i, 'cantidad', e.target.value)}
                          className="w-24 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          step="0.01"
                          min={0}
                          value={it.precio_unitario}
                          onChange={(e) => actualizarItem(i, 'precio_unitario', e.target.value)}
                          className="w-32 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={it.lote}
                          onChange={(e) => actualizarItem(i, 'lote', e.target.value)}
                          className="w-28 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                          placeholder="Opcional"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="date"
                          value={it.fecha_vencimiento}
                          onChange={(e) => actualizarItem(i, 'fecha_vencimiento', e.target.value)}
                          className="w-40 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                        />
                      </td>
                      <td className="px-3 py-2 text-slate-700">{formatCurrency(subtotal)}</td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => eliminarItem(i)}
                          className="rounded-md bg-red-600 px-2 py-1 text-xs text-white transition hover:bg-red-700"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-5 rounded-xl bg-slate-900 px-5 py-4 text-white">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-300">Total compra</p>
          <p className="mt-1 text-3xl font-bold">{formatCurrency(totalCompra)}</p>

          <button
            type="button"
            onClick={registrarCompra}
            disabled={saving || loading}
            className="mt-4 w-full rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Registrando compra...' : 'Registrar Compra'}
          </button>
        </div>
      </article>

      <article className="mt-6 min-w-0 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-slate-800">Ultimas compras</h3>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="px-3 py-2 font-semibold">ID</th>
                <th className="px-3 py-2 font-semibold">Proveedor</th>
                <th className="px-3 py-2 font-semibold">Fecha</th>
                <th className="px-3 py-2 font-semibold">Monto</th>
                <th className="px-3 py-2 font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody>
              {comprasPrevias.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                    No hay compras registradas.
                  </td>
                </tr>
              ) : (
                comprasPrevias.map((c) => (
                  <tr key={c.id_compra} className="border-t border-slate-100">
                    <td className="px-3 py-2 text-slate-700">{c.id_compra}</td>
                    <td className="px-3 py-2 text-slate-700">{c.proveedor_nombre || c.id_proveedor}</td>
                    <td className="px-3 py-2 text-slate-700">
                      {c.fecha_compra ? new Date(c.fecha_compra).toLocaleString('es-BO') : '-'}
                    </td>
                    <td className="px-3 py-2 text-slate-700">{formatCurrency(c.monto_total)}</td>
                    <td className="px-3 py-2 text-slate-700">{c.estado_compra}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
