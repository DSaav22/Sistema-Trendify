import { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = '/api/categorias/';

export default function CategoriaManager() {
  const [categorias, setCategorias] = useState([]);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchCategorias = async () => {
    setLoading(true);
    setError('');

    try {
      const { data } = await axios.get(API_URL);
      setCategorias(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error al cargar categorias:', err);
      setError('No se pudieron cargar las categorias. Verifica que el backend este activo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategorias();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!nombre.trim()) {
      setError('El nombre es obligatorio.');
      return;
    }

    setSaving(true);
    try {
      await axios.post(API_URL, {
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        estado: 'activo',
      });

      setNombre('');
      setDescripcion('');
      await fetchCategorias();
    } catch (err) {
      console.error('Error al crear categoria:', err);
      setError('No se pudo crear la categoria. Revisa los datos e intenta nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (idCategoria) => {
    const confirmar = window.confirm('Deseas eliminar esta categoria?');
    if (!confirmar) return;

    setError('');

    try {
      await axios.delete(`${API_URL}${idCategoria}/`);
      setCategorias((prev) => prev.filter((item) => (item.id_categoria ?? item.id) !== idCategoria));
    } catch (err) {
      console.error('Error al eliminar categoria:', err);
      setError('No se pudo eliminar la categoria.');
    }
  };

  return (
    <section className="mx-auto w-full max-w-5xl p-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-2xl font-bold text-slate-800">Gestion de Categorias</h2>

        <form onSubmit={handleSubmit} className="mb-6 grid gap-3 md:grid-cols-3">
          <input
            type="text"
            placeholder="Nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-sky-500"
          />

          <input
            type="text"
            placeholder="Descripcion"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-sky-500"
          />

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-sky-600 px-4 py-2 font-medium text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Guardando...' : 'Crear Categoria'}
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
                <th className="px-3 py-2 font-semibold">Descripcion</th>
                <th className="px-3 py-2 font-semibold">Estado</th>
                <th className="px-3 py-2 font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                    Cargando categorias...
                  </td>
                </tr>
              ) : categorias.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                    No hay categorias registradas.
                  </td>
                </tr>
              ) : (
                categorias.map((categoria) => {
                  const id = categoria.id_categoria ?? categoria.id;
                  return (
                    <tr key={id} className="border-b border-slate-100 text-slate-700">
                      <td className="px-3 py-2">{id}</td>
                      <td className="px-3 py-2">{categoria.nombre}</td>
                      <td className="px-3 py-2">{categoria.descripcion || '-'}</td>
                      <td className="px-3 py-2">{categoria.estado || '-'}</td>
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
