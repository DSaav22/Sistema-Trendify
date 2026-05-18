import { useEffect, useMemo, useState } from 'react';
import api from './src/utils/api';

const API_BASE = '/api';
const INVENTARIO_URL = `${API_BASE}/inventario/`;
const MOVIMIENTOS_URL = `${API_BASE}/movimientos/`;
const PRODUCTOS_URL = `${API_BASE}/productos/`;

export default function InventarioDashboard() {
  const [inventario, setInventario] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [productos, setProductos] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Edicion inline de stock_minimo: {id_inventario: nuevoValor}
  const [stockMinEditado, setStockMinEditado] = useState({});
  const [guardandoStockMin, setGuardandoStockMin] = useState(null);

  const [formData, setFormData] = useState({
    id_producto: '',
    tipo_movimiento: 'entrada',
    cantidad: '',
    motivo: '',
    id_usuario: 1,
  });

  const canSubmit = useMemo(() => {
    return (
      formData.id_producto !== '' &&
      formData.tipo_movimiento !== '' &&
      Number(formData.cantidad) > 0 &&
      Number(formData.id_usuario) > 0
    );
  }, [formData]);

  const cargarDashboard = async () => {
    setLoading(true);
    setError('');

    try {
      const [resInventario, resMovimientos, resProductos] = await Promise.all([
        api.get(INVENTARIO_URL),
        api.get(MOVIMIENTOS_URL),
        api.get(PRODUCTOS_URL),
      ]);

      setInventario(Array.isArray(resInventario.data) ? resInventario.data : []);
      setMovimientos(Array.isArray(resMovimientos.data) ? resMovimientos.data : []);
      setProductos(Array.isArray(resProductos.data) ? resProductos.data : []);
    } catch (err) {
      console.error('Error cargando dashboard de inventario:', err);
      setError('No se pudo cargar el panel de inventario. Verifica que la API este activa.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDashboard();
  }, []);

  const cambiarStockMin = (idInventario, valor) => {
    setStockMinEditado((prev) => ({ ...prev, [idInventario]: valor }));
  };

  const guardarStockMin = async (item) => {
    const id = item.id_inventario ?? item.id;
    const nuevoValor = stockMinEditado[id];
    if (nuevoValor === undefined) return;

    const parsed = Number(nuevoValor);
    if (!Number.isFinite(parsed) || parsed < 0) {
      setError('Stock minimo debe ser un numero >= 0.');
      return;
    }

    setError('');
    setSuccess('');
    setGuardandoStockMin(id);
    try {
      await api.patch(`${INVENTARIO_URL}${id}/`, { stock_minimo: parsed });
      setSuccess(`Stock minimo actualizado para ${item.producto_nombre || 'producto'}.`);
      setStockMinEditado((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      await cargarDashboard();
    } catch (err) {
      console.error('Error actualizando stock minimo:', err);
      setError(err?.response?.data?.detail || 'No se pudo actualizar el stock minimo.');
    } finally {
      setGuardandoStockMin(null);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setFormData((prev) => ({
      ...prev,
      id_producto: '',
      tipo_movimiento: 'entrada',
      cantidad: '',
      motivo: '',
      id_usuario: 1,
    }));
  };

  const handleSubmitMovimiento = async (e) => {
    e.preventDefault();
    setError('');

    if (!canSubmit) {
      setError('Completa los campos obligatorios para registrar el movimiento.');
      return;
    }

    setSaving(true);
    try {
      await api.post(MOVIMIENTOS_URL, {
        id_producto: Number(formData.id_producto),
        tipo_movimiento: formData.tipo_movimiento,
        cantidad: Number(formData.cantidad),
        motivo: formData.motivo.trim(),
        id_usuario: Number(formData.id_usuario),
      });

      resetForm();
      await cargarDashboard();
    } catch (err) {
      console.error('Error registrando movimiento:', err);
      setError('No se pudo registrar el movimiento. Revisa los datos e intenta nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-7xl">
      <div className="mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Inventario Dashboard</h2>
        <p className="mt-1 text-sm text-slate-500">Control de stock, alertas y registro de movimientos.</p>
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      {success && (
        <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p>
      )}

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
          <h3 className="mb-4 text-base sm:text-lg font-semibold text-slate-800">Estado Actual del Inventario</h3>

          <div className="overflow-x-auto rounded-xl border border-slate-200 max-w-full">
            <table className="min-w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-700">
                <tr>
                  <th className="px-4 py-3 font-semibold">Producto</th>
                  <th className="px-4 py-3 font-semibold">Stock Actual</th>
                  <th className="px-4 py-3 font-semibold">Stock Minimo</th>
                  <th className="px-4 py-3 font-semibold">Ultima Actualizacion</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                      Cargando inventario...
                    </td>
                  </tr>
                ) : inventario.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                      No hay registros de inventario.
                    </td>
                  </tr>
                ) : (
                  inventario.map((item) => {
                    const id = item.id_inventario ?? item.id;
                    const stockActual = Number(item.stock_actual ?? 0);
                    const stockMinimo = Number(item.stock_minimo ?? 0);
                    const valorEditado = stockMinEditado[id];
                    const valorMostrado = valorEditado !== undefined ? valorEditado : stockMinimo;
                    const cambioPendiente = valorEditado !== undefined && Number(valorEditado) !== stockMinimo;
                    const enAlerta = stockActual <= stockMinimo;

                    return (
                      <tr
                        key={id}
                        className={`border-t border-slate-100 ${enAlerta ? 'bg-red-50/80' : 'bg-white'}`}
                      >
                        <td className="px-4 py-3 font-medium text-slate-800">
                          <span className="inline-flex items-center gap-2">
                            {enAlerta && <span title="Stock bajo">⚠️</span>}
                            {item.producto_nombre || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-700">{stockActual}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={0}
                              value={valorMostrado}
                              onChange={(e) => cambiarStockMin(id, e.target.value)}
                              className="w-20 rounded-md border border-slate-300 px-2 py-1 text-sm"
                            />
                            {cambioPendiente && (
                              <button
                                type="button"
                                onClick={() => guardarStockMin(item)}
                                disabled={guardandoStockMin === id}
                                className="rounded-md bg-emerald-500 px-2 py-1 text-xs font-bold text-white transition hover:bg-emerald-600 disabled:opacity-50"
                              >
                                {guardandoStockMin === id ? '...' : 'Guardar'}
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{item.ultima_actualizacion || '-'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </article>

        <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-slate-800">Registrar Movimiento</h3>

          <form onSubmit={handleSubmitMovimiento} className="grid gap-3">
            <select
              name="id_producto"
              value={formData.id_producto}
              onChange={handleChange}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none transition focus:border-sky-500"
            >
              <option value="">Selecciona un producto</option>
              {productos.map((producto) => (
                <option key={producto.id_producto ?? producto.id} value={producto.id_producto ?? producto.id}>
                  {producto.nombre}
                </option>
              ))}
            </select>

            <select
              name="tipo_movimiento"
              value={formData.tipo_movimiento}
              onChange={handleChange}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none transition focus:border-sky-500"
            >
              <option value="entrada">entrada</option>
              <option value="salida">salida</option>
            </select>

            <input
              type="number"
              min="1"
              name="cantidad"
              value={formData.cantidad}
              onChange={handleChange}
              placeholder="Cantidad"
              className="rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-sky-500"
            />

            <input
              type="text"
              name="motivo"
              value={formData.motivo}
              onChange={handleChange}
              placeholder="Motivo"
              className="rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-sky-500"
            />

            <input
              type="number"
              name="id_usuario"
              value={formData.id_usuario}
              readOnly
              className="rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-slate-600"
            />

            <button
              type="submit"
              disabled={saving || !canSubmit}
              className="rounded-lg bg-sky-600 px-4 py-2 font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Registrando...' : 'Registrar Movimiento'}
            </button>
          </form>

          <div className="mt-6">
            <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-600">Ultimos Movimientos</h4>
            <div className="max-h-64 overflow-auto rounded-lg border border-slate-200">
              <table className="min-w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Producto</th>
                    <th className="px-3 py-2 font-semibold">Tipo</th>
                    <th className="px-3 py-2 font-semibold">Cantidad</th>
                    <th className="px-3 py-2 font-semibold">Motivo</th>
                    <th className="px-3 py-2 font-semibold">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-4 text-center text-slate-500">
                        Cargando movimientos...
                      </td>
                    </tr>
                  ) : movimientos.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-4 text-center text-slate-500">
                        Sin movimientos registrados.
                      </td>
                    </tr>
                  ) : (
                    movimientos
                      .slice()
                      .reverse()
                      .slice(0, 8)
                      .map((mov) => (
                        <tr key={mov.id_movimiento ?? mov.id} className="border-t border-slate-100">
                          <td className="px-3 py-2 text-slate-700">{mov.producto_nombre || '-'}</td>
                          <td className="px-3 py-2 text-slate-700">{mov.tipo_movimiento}</td>
                          <td className="px-3 py-2 text-slate-700">{mov.cantidad}</td>
                          <td className="px-3 py-2 text-slate-600">{mov.motivo || '-'}</td>
                          <td className="px-3 py-2 text-slate-500">{mov.fecha_movimiento || '-'}</td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
