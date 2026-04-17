import { useEffect, useState } from 'react';

import api from '../utils/api';

const BITACORA_URL = '/api/bitacora/';

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('es-BO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export default function BitacoraManager() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchBitacora = async () => {
    setLoading(true);
    setError('');

    try {
      const { data } = await api.get(BITACORA_URL);
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error al cargar bitacora:', err);
      setError('No se pudo cargar la bitacora. Verifica la API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBitacora();
  }, []);

  return (
    <section className="mx-auto w-full max-w-7xl">
      <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
        <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Bitacora del Sistema</h2>
            <p className="mt-1 text-sm text-slate-500">Historial de auditoria de acciones realizadas en la plataforma.</p>
          </div>
          <button
            onClick={fetchBitacora}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-slate-700 focus:ring-2 focus:ring-slate-400 focus:outline-none disabled:opacity-50 sm:w-auto"
          >
            <svg className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refrescar
          </button>
        </header>

        {error && (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <div className="overflow-x-auto max-w-full rounded-xl border border-slate-200">
          <table className="min-w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="px-4 py-3 font-semibold">Fecha</th>
                <th className="px-4 py-3 font-semibold">Usuario</th>
                <th className="px-4 py-3 font-semibold">Accion</th>
                <th className="px-4 py-3 font-semibold">Tabla</th>
                <th className="px-4 py-3 font-semibold">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                    Cargando bitacora...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                    No hay registros en la bitacora.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const id = log.id_bitacora ?? log.id;
                  return (
                    <tr key={id} className="border-t border-slate-100 align-top">
                      <td className="whitespace-nowrap px-4 py-3 text-slate-700">{formatDate(log.fecha_hora)}</td>
                      <td className="px-4 py-3 text-slate-700">{log.usuario_nombre || log.id_usuario || '-'}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                          {log.accion || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{log.tabla_afectada || '-'}</td>
                      <td className="max-w-lg px-4 py-3 text-slate-700">{log.detalle || '-'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
