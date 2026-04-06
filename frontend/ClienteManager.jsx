import { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = '/api/clientes/';

export default function ClienteManager() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    nombre_completo: '',
    telefono: '',
    ciudad: '',
    direccion: '',
    es_top: false,
  });

  const fetchClientes = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.get(API_URL);
      setClientes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error al cargar clientes:', err);
      setError('No se pudieron cargar los clientes. Verifica que el backend este activo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.nombre_completo.trim()) {
      setError('El nombre completo es obligatorio.');
      return;
    }

    setSaving(true);
    try {
      await axios.post(API_URL, {
        nombre_completo: formData.nombre_completo.trim(),
        telefono: formData.telefono.trim(),
        ciudad: formData.ciudad.trim(),
        direccion: formData.direccion.trim(),
        es_top: formData.es_top,
        estado: 'activo',
      });

      setFormData({
        nombre_completo: '',
        telefono: '',
        ciudad: '',
        direccion: '',
        es_top: false,
      });

      await fetchClientes();
    } catch (err) {
      console.error('Error al crear cliente:', err);
      setError('No se pudo registrar el cliente. Revisa los datos e intenta nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (idCliente) => {
    const confirmar = window.confirm('Deseas eliminar este cliente?');
    if (!confirmar) return;

    setError('');
    try {
      await axios.delete(`${API_URL}${idCliente}/`);
      setClientes((prev) => prev.filter((cliente) => (cliente.id_cliente ?? cliente.id) !== idCliente));
    } catch (err) {
      console.error('Error al eliminar cliente:', err);
      setError('No se pudo eliminar el cliente.');
    }
  };

  return (
    <section className="mx-auto w-full max-w-6xl p-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-2xl font-bold text-slate-800">Gestion de Clientes</h2>

        <form onSubmit={handleSubmit} className="mb-6 grid gap-3 md:grid-cols-2">
          <input
            type="text"
            name="nombre_completo"
            placeholder="Nombre completo"
            value={formData.nombre_completo}
            onChange={handleChange}
            className="rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-sky-500"
          />

          <input
            type="text"
            name="telefono"
            placeholder="Telefono"
            value={formData.telefono}
            onChange={handleChange}
            className="rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-sky-500"
          />

          <input
            type="text"
            name="ciudad"
            placeholder="Ciudad"
            value={formData.ciudad}
            onChange={handleChange}
            className="rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-sky-500"
          />

          <input
            type="text"
            name="direccion"
            placeholder="Direccion"
            value={formData.direccion}
            onChange={handleChange}
            className="rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-sky-500"
          />

          <label className="flex items-center gap-2 text-slate-700 md:col-span-2">
            <input
              type="checkbox"
              name="es_top"
              checked={formData.es_top}
              onChange={handleChange}
              className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
            />
            Es Cliente TOP
          </label>

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-sky-600 px-4 py-2 font-medium text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60 md:col-span-2"
          >
            {saving ? 'Guardando...' : 'Registrar Cliente'}
          </button>
        </form>

        {error && (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-700">
                <th className="px-3 py-2 font-semibold">ID</th>
                <th className="px-3 py-2 font-semibold">Nombre</th>
                <th className="px-3 py-2 font-semibold">Telefono</th>
                <th className="px-3 py-2 font-semibold">Ciudad</th>
                <th className="px-3 py-2 font-semibold">Direccion</th>
                <th className="px-3 py-2 font-semibold">Estado</th>
                <th className="px-3 py-2 font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-slate-500">
                    Cargando clientes...
                  </td>
                </tr>
              ) : clientes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-slate-500">
                    No hay clientes registrados.
                  </td>
                </tr>
              ) : (
                clientes.map((cliente) => {
                  const id = cliente.id_cliente ?? cliente.id;
                  const esTop = Boolean(cliente.es_top);

                  return (
                    <tr
                      key={id}
                      className={`border-b border-slate-100 ${esTop ? 'bg-amber-50/60' : 'bg-white'}`}
                    >
                      <td className="px-3 py-2 text-slate-700">{id}</td>
                      <td className="px-3 py-2 font-medium text-slate-800">
                        <div className="flex items-center gap-2">
                          <span>{cliente.nombre_completo}</span>
                          {esTop && (
                            <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                              ⭐ VIP
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-slate-700">{cliente.telefono || '-'}</td>
                      <td className="px-3 py-2 text-slate-700">{cliente.ciudad || '-'}</td>
                      <td className="px-3 py-2 text-slate-700">{cliente.direccion || '-'}</td>
                      <td className="px-3 py-2 text-slate-700">{cliente.estado || '-'}</td>
                      <td className="px-3 py-2">
                        <button
                          onClick={() => handleDelete(id)}
                          className="rounded-md bg-red-600 px-3 py-1.5 text-white transition hover:bg-red-700"
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
      </div>
    </section>
  );
}
