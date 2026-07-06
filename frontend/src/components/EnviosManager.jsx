import { useCallback, useEffect, useMemo, useState } from 'react';

import api from '../utils/api';

const ENVIOS_URL = '/api/envios/';
const VENTAS_ELEGIBLES_URL = '/api/envios/ventas-elegibles/';

const TIPOS_ENVIO = [
  { value: 'contraentrega_sc', label: 'Contraentrega Santa Cruz' },
  { value: 'transportadora_interior', label: 'Transportadora al interior' },
  { value: 'domicilio', label: 'Domicilio (legacy)' },
];

const ESTADOS_SIGUIENTES = {
  preparando: ['en_camino', 'cancelado'],
  procesando: ['en_camino', 'cancelado', 'despachado'],
  en_camino: ['entregado', 'cancelado'],
  en_ruta: ['entregado', 'cancelado'],
  despachado: ['entregado', 'cancelado', 'en_camino'],
};

const LABEL_ESTADO = {
  preparando: 'Preparando',
  procesando: 'Preparando',
  en_camino: 'En camino',
  en_ruta: 'En camino',
  despachado: 'En camino',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};

function normalizeList(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  return [];
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('es-BO', {
    style: 'currency',
    currency: 'BOB',
    minimumFractionDigits: 2,
  });
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' });
}

function badgeEstado(estado) {
  const e = (estado || '').toLowerCase();
  if (e === 'entregado') return 'bg-emerald-100 text-emerald-700';
  if (e === 'cancelado') return 'bg-red-100 text-red-700';
  if (e === 'preparando' || e === 'procesando') return 'bg-amber-100 text-amber-800';
  return 'bg-sky-100 text-sky-800';
}

function labelTipo(tipo) {
  const item = TIPOS_ENVIO.find((t) => t.value === tipo);
  return item ? item.label : tipo || '-';
}

function labelEstado(estado) {
  return LABEL_ESTADO[(estado || '').toLowerCase()] || estado || '-';
}

const REPARTIDORES_SUGERIDOS = [
  'Trendify Delivery SCZ',
  'Juan Mensajero',
  'Maria Delivery',
  'RapidGo Santa Cruz',
];

function puedeAsignarRepartidor(tipo) {
  const t = (tipo || '').toLowerCase();
  return t === 'contraentrega_sc' || t === 'domicilio';
}

function CrearEnvioModal({ open, onClose, onCreated }) {
  const [ventas, setVentas] = useState([]);
  const [loadingVentas, setLoadingVentas] = useState(false);
  const [form, setForm] = useState({
    id_venta: '',
    tipo_envio: 'contraentrega_sc',
    empresa_transporte: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    setError('');
    setForm({ id_venta: '', tipo_envio: 'contraentrega_sc', empresa_transporte: '' });
    setLoadingVentas(true);
    api
      .get(VENTAS_ELEGIBLES_URL)
      .then(({ data }) => setVentas(normalizeList(data)))
      .catch(() => setVentas([]))
      .finally(() => setLoadingVentas(false));
    return undefined;
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.id_venta) {
      setError('Selecciona una venta.');
      return;
    }
    if (form.tipo_envio === 'transportadora_interior' && !form.empresa_transporte.trim()) {
      setError('Indica la empresa transportadora.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        id_venta: Number(form.id_venta),
        tipo_envio: form.tipo_envio,
        empresa_transporte: form.empresa_transporte.trim() || null,
      };
      const { data } = await api.post(ENVIOS_URL, payload);
      onCreated(data);
      onClose();
    } catch (err) {
      const detail = err?.response?.data;
      if (typeof detail === 'string') {
        setError(detail);
      } else if (detail?.id_venta) {
        setError(Array.isArray(detail.id_venta) ? detail.id_venta[0] : detail.id_venta);
      } else if (detail?.empresa_transporte) {
        setError(Array.isArray(detail.empresa_transporte) ? detail.empresa_transporte[0] : detail.empresa_transporte);
      } else if (detail?.detail) {
        setError(detail.detail);
      } else {
        setError('No se pudo registrar el envio.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(ev) => ev.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-slate-900">Registrar envio (CU27)</h3>
        <p className="mt-1 text-sm text-slate-500">Venta completada sin envio previo.</p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Venta</label>
            <select
              value={form.id_venta}
              onChange={(ev) => setForm((f) => ({ ...f, id_venta: ev.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              disabled={loadingVentas || saving}
            >
              <option value="">Seleccionar...</option>
              {ventas.map((v) => (
                <option key={v.id_venta} value={v.id_venta}>
                  #{v.id_venta} — {v.cliente_nombre} — {formatCurrency(v.monto_total)}
                </option>
              ))}
            </select>
            {!loadingVentas && ventas.length === 0 && (
              <p className="mt-2 text-xs text-amber-700">No hay ventas completadas pendientes de envio.</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Tipo de envio</label>
            <select
              value={form.tipo_envio}
              onChange={(ev) => setForm((f) => ({ ...f, tipo_envio: ev.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              disabled={saving}
            >
              {TIPOS_ENVIO.filter((t) => t.value !== 'domicilio').map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Transportadora</label>
            <input
              type="text"
              value={form.empresa_transporte}
              onChange={(ev) => setForm((f) => ({ ...f, empresa_transporte: ev.target.value }))}
              placeholder={form.tipo_envio === 'contraentrega_sc' ? 'Opcional (ej. Trendify Delivery)' : 'Obligatorio'}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              disabled={saving}
            />
          </div>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700"
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-60"
              disabled={saving || ventas.length === 0}
            >
              {saving ? 'Guardando...' : 'Registrar envio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EnviosManager() {
  const [envios, setEnvios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [modalCrear, setModalCrear] = useState(false);
  const [actualizandoId, setActualizandoId] = useState(null);
  const [toast, setToast] = useState('');

  const cargarEnvios = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = filtroEstado ? { estado: filtroEstado } : {};
      const { data } = await api.get(ENVIOS_URL, { params });
      setEnvios(normalizeList(data));
    } catch {
      setError('No se pudo cargar el listado de envios.');
      setEnvios([]);
    } finally {
      setLoading(false);
    }
  }, [filtroEstado]);

  useEffect(() => {
    cargarEnvios();
  }, [cargarEnvios]);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(''), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const enviosActivos = useMemo(
    () => envios.filter((e) => !['entregado', 'cancelado'].includes((e.estado_envio || '').toLowerCase())),
    [envios],
  );

  const cambiarEstado = async (envio, nuevoEstado) => {
    setActualizandoId(envio.id_envio);
    try {
      const { data } = await api.patch(`${ENVIOS_URL}${envio.id_envio}/`, { estado_envio: nuevoEstado });
      setToast(`Envio #${envio.id_envio} actualizado a ${labelEstado(nuevoEstado)}`);
      if (data?.codigo_recepcion) {
        setToast(`Codigo recepcion (CU32): ${data.codigo_recepcion}`);
      }
      await cargarEnvios();
    } catch (err) {
      const msg = err?.response?.data?.estado_envio?.[0]
        || err?.response?.data?.detail
        || 'No se pudo actualizar el estado.';
      setError(typeof msg === 'string' ? msg : 'Error al actualizar estado.');
    } finally {
      setActualizandoId(null);
    }
  };

  const asignarRepartidor = async (envio, repartidor) => {
    if (!repartidor?.trim()) return;
    setActualizandoId(envio.id_envio);
    try {
      const { data } = await api.patch(`${ENVIOS_URL}${envio.id_envio}/`, { repartidor: repartidor.trim() });
      setToast(`Repartidor asignado: ${repartidor}`);
      if (data?.codigo_recepcion && !envio.codigo_recepcion) {
        setToast(`Repartidor OK. Codigo CU32: ${data.codigo_recepcion}`);
      }
      await cargarEnvios();
    } catch (err) {
      const msg = err?.response?.data?.repartidor?.[0]
        || err?.response?.data?.detail
        || 'No se pudo asignar repartidor.';
      setError(typeof msg === 'string' ? msg : 'Error al asignar repartidor.');
    } finally {
      setActualizandoId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Logistica y envios</h2>
          <p className="mt-1 text-sm text-slate-500">CU27–CU28–CU31 operador · CU29–CU30–CU32 cliente</p>
        </div>
        <button
          type="button"
          onClick={() => setModalCrear(true)}
          className="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-sky-700"
        >
          + Registrar envio
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-slate-500">Total envios</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{envios.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-slate-500">Activos</p>
          <p className="mt-1 text-2xl font-black text-sky-700">{enviosActivos.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <label className="text-xs font-semibold uppercase text-slate-500">Filtrar estado</label>
          <select
            value={filtroEstado}
            onChange={(ev) => setFiltroEstado(ev.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">Todos</option>
            <option value="preparando">Preparando</option>
            <option value="procesando">Procesando (seed)</option>
            <option value="en_camino">En camino</option>
            <option value="en_ruta">En ruta (seed)</option>
            <option value="entregado">Entregado</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <p className="p-8 text-center text-slate-500">Cargando envios...</p>
        ) : envios.length === 0 ? (
          <p className="p-8 text-center text-slate-500">No hay envios registrados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-700">
                <tr>
                  <th className="px-4 py-3 font-semibold">Pedido</th>
                  <th className="px-4 py-3 font-semibold">Cliente</th>
                  <th className="px-4 py-3 font-semibold">Tipo</th>
                  <th className="px-4 py-3 font-semibold">Transportadora</th>
                  <th className="px-4 py-3 font-semibold">Repartidor</th>
                  <th className="px-4 py-3 font-semibold">Codigo CU32</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {envios.map((envio) => {
                  const estado = (envio.estado_envio || '').toLowerCase();
                  const siguientes = ESTADOS_SIGUIENTES[estado] || [];
                  const bloqueado = ['entregado', 'cancelado'].includes(estado);
                  return (
                    <tr key={envio.id_envio} className="border-t border-slate-100">
                      <td className="px-4 py-3 font-semibold text-slate-900">#{envio.id_venta}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800">{envio.cliente_nombre || '-'}</p>
                        <p className="text-xs text-slate-500">{formatDate(envio.fecha_venta)}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{labelTipo(envio.tipo_envio)}</td>
                      <td className="px-4 py-3 text-slate-700">{envio.empresa_transporte || '-'}</td>
                      <td className="px-4 py-3 text-slate-700">
                        {puedeAsignarRepartidor(envio.tipo_envio) ? (
                          <div className="flex flex-col gap-1">
                            <span className="text-xs">{envio.repartidor || 'Sin asignar'}</span>
                            <select
                              className="max-w-[140px] rounded border border-slate-200 px-1 py-0.5 text-xs"
                              defaultValue=""
                              disabled={actualizandoId === envio.id_envio}
                              onChange={(ev) => {
                                if (ev.target.value) asignarRepartidor(envio, ev.target.value);
                              }}
                            >
                              <option value="">CU31 Asignar...</option>
                              {REPARTIDORES_SUGERIDOS.map((r) => (
                                <option key={r} value={r}>{r}</option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">N/A interior</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-violet-700">
                        {envio.codigo_recepcion || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${badgeEstado(estado)}`}>
                          {envio.estado_legible || labelEstado(estado)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {bloqueado ? (
                          <span className="text-xs text-slate-400">Finalizado</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {siguientes.map((sig) => (
                              <button
                                key={sig}
                                type="button"
                                disabled={actualizandoId === envio.id_envio}
                                onClick={() => cambiarEstado(envio, sig)}
                                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                              >
                                → {labelEstado(sig)}
                              </button>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CrearEnvioModal
        open={modalCrear}
        onClose={() => setModalCrear(false)}
        onCreated={() => {
          setToast('Envio registrado correctamente.');
          cargarEnvios();
        }}
      />

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
}
