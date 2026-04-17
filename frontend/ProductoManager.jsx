import { useEffect, useMemo, useState } from 'react';
import api from './src/utils/api';

const API_BASE = '/api';
const PRODUCTOS_URL = `${API_BASE}/productos/`;
const CATEGORIAS_URL = `${API_BASE}/categorias/`;
const MARCAS_URL = `${API_BASE}/marcas/`;

export default function ProductoManager() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [marcas, setMarcas] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio_compra: '',
    precio_venta: '',
    estado: 'activo',
    id_categoria: '',
    id_marca: '',
  });

  const canSubmit = useMemo(() => {
    return (
      formData.nombre.trim() &&
      formData.precio_compra !== '' &&
      formData.precio_venta !== '' &&
      formData.id_categoria !== '' &&
      formData.id_marca !== ''
    );
  }, [formData]);

  const cargarDatosIniciales = async () => {
    setLoading(true);
    setError('');

    try {
      const [resProductos, resCategorias, resMarcas] = await Promise.all([
        api.get(PRODUCTOS_URL),
        api.get(CATEGORIAS_URL),
        api.get(MARCAS_URL),
      ]);

      setProductos(Array.isArray(resProductos.data) ? resProductos.data : []);
      setCategorias(Array.isArray(resCategorias.data) ? resCategorias.data : []);
      setMarcas(Array.isArray(resMarcas.data) ? resMarcas.data : []);
    } catch (err) {
      console.error('Error cargando catalogos/productos:', err);
      setError('No se pudieron cargar productos, categorias o marcas. Verifica tu API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      precio_compra: '',
      precio_venta: '',
      estado: 'activo',
      id_categoria: '',
      id_marca: '',
    });
  };

  const handleCreateProducto = async (e) => {
    e.preventDefault();
    setError('');

    if (!canSubmit) {
      setError('Completa los campos obligatorios del formulario.');
      return;
    }

    setSaving(true);
    try {
      await api.post(PRODUCTOS_URL, {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim(),
        precio_compra: formData.precio_compra,
        precio_venta: formData.precio_venta,
        estado: formData.estado,
        id_categoria: Number(formData.id_categoria),
        id_marca: Number(formData.id_marca),
        atributos: {},
      });

      resetForm();
      await cargarDatosIniciales();
    } catch (err) {
      console.error('Error al crear producto:', err);
      setError('No se pudo registrar el producto. Revisa los datos e intenta nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProducto = async (idProducto) => {
    const confirmar = window.confirm('Deseas eliminar este producto?');
    if (!confirmar) return;

    setError('');
    try {
      await api.delete(`${PRODUCTOS_URL}${idProducto}/`);
      setProductos((prev) => prev.filter((p) => (p.id_producto ?? p.id) !== idProducto));
    } catch (err) {
      console.error('Error al eliminar producto:', err);
      setError('No se pudo eliminar el producto.');
    }
  };

  return (
    <section className="mx-auto w-full max-w-7xl">
      <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
        <header className="mb-5">
          <h2 className="text-2xl font-bold text-slate-800">Gestion de Productos</h2>
          <p className="mt-1 text-sm text-slate-500">Core del negocio: alta y control del catalogo de productos.</p>
        </header>

        <form onSubmit={handleCreateProducto} className="mb-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <input
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={handleInputChange}
            placeholder="Nombre del producto"
            className="rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-sky-500"
          />

          <input
            type="text"
            name="descripcion"
            value={formData.descripcion}
            onChange={handleInputChange}
            placeholder="Descripcion"
            className="rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-sky-500"
          />

          <input
            type="number"
            step="0.01"
            min="0"
            name="precio_compra"
            value={formData.precio_compra}
            onChange={handleInputChange}
            placeholder="Precio compra"
            className="rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-sky-500"
          />

          <input
            type="number"
            step="0.01"
            min="0"
            name="precio_venta"
            value={formData.precio_venta}
            onChange={handleInputChange}
            placeholder="Precio venta"
            className="rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-sky-500"
          />

          <select
            name="id_categoria"
            value={formData.id_categoria}
            onChange={handleInputChange}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none transition focus:border-sky-500"
          >
            <option value="">Selecciona categoria</option>
            {categorias.map((cat) => (
              <option key={cat.id_categoria ?? cat.id} value={cat.id_categoria ?? cat.id}>
                {cat.nombre}
              </option>
            ))}
          </select>

          <select
            name="id_marca"
            value={formData.id_marca}
            onChange={handleInputChange}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none transition focus:border-sky-500"
          >
            <option value="">Selecciona marca</option>
            {marcas.map((m) => (
              <option key={m.id_marca ?? m.id} value={m.id_marca ?? m.id}>
                {m.nombre}
              </option>
            ))}
          </select>

          <select
            name="estado"
            value={formData.estado}
            onChange={handleInputChange}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none transition focus:border-sky-500"
          >
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </select>

          <button
            type="submit"
            disabled={saving || !canSubmit}
            className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Guardando...' : 'Registrar Producto'}
          </button>
        </form>

        {error && (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <div className="overflow-x-auto max-w-full rounded-xl border border-slate-200">
          <table className="min-w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="px-4 py-3 font-semibold">Nombre</th>
                <th className="px-4 py-3 font-semibold">Categoria</th>
                <th className="px-4 py-3 font-semibold">Precio Compra</th>
                <th className="px-4 py-3 font-semibold">Precio Venta</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-6 text-center text-slate-500" colSpan={6}>
                    Cargando datos...
                  </td>
                </tr>
              ) : productos.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-center text-slate-500" colSpan={6}>
                    No hay productos registrados.
                  </td>
                </tr>
              ) : (
                productos.map((producto) => {
                  const id = producto.id_producto ?? producto.id;
                  return (
                    <tr key={id} className="border-t border-slate-100 hover:bg-slate-50/70">
                      <td className="px-4 py-3 text-slate-800">{producto.nombre}</td>
                      <td className="px-4 py-3 text-slate-700">{producto.categoria_nombre || '-'}</td>
                      <td className="px-4 py-3 text-slate-700">${producto.precio_compra}</td>
                      <td className="px-4 py-3 text-slate-700">${producto.precio_venta}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            producto.estado === 'activo'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {producto.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDeleteProducto(id)}
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
