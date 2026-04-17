import { useEffect, useState } from 'react';

import api from './src/utils/api';

const USUARIOS_URL = '/api/usuarios/';
const ROLES_URL = '/api/roles/';

export default function UsuarioManager() {
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    username: '',
    password_hash: '',
    nombre_completo: '',
    id_rol: '',
    estado: 'activo',
  });

  const fetchData = async () => {
    setLoading(true);
    setError('');

    try {
      const [usuariosResponse, rolesResponse] = await Promise.all([
        api.get(USUARIOS_URL),
        api.get(ROLES_URL),
      ]);

      setUsuarios(Array.isArray(usuariosResponse.data) ? usuariosResponse.data : []);
      setRoles(Array.isArray(rolesResponse.data) ? rolesResponse.data : []);
    } catch (err) {
      console.error('Error al cargar usuarios/roles:', err);
      setError('No se pudieron cargar usuarios y roles. Verifica la API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!formData.username.trim() || !formData.password_hash || !formData.nombre_completo.trim() || !formData.id_rol) {
      setError('Completa todos los campos obligatorios del formulario.');
      return;
    }

    setSaving(true);
    try {
      await api.post(USUARIOS_URL, {
        username: formData.username.trim(),
        password_hash: formData.password_hash,
        nombre_completo: formData.nombre_completo.trim(),
        id_rol: Number(formData.id_rol),
        estado: formData.estado,
      });

      setFormData({
        username: '',
        password_hash: '',
        nombre_completo: '',
        id_rol: '',
        estado: 'activo',
      });

      await fetchData();
    } catch (err) {
      console.error('Error al crear usuario:', err);
      setError('No se pudo crear el usuario. Revisa los datos e intenta nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (idUsuario) => {
    const confirmar = window.confirm('Deseas eliminar este usuario?');
    if (!confirmar) return;

    setError('');
    try {
      await api.delete(`${USUARIOS_URL}${idUsuario}/`);
      setUsuarios((prev) => prev.filter((usuario) => (usuario.id_usuario ?? usuario.id) !== idUsuario));
    } catch (err) {
      console.error('Error al eliminar usuario:', err);
      setError('No se pudo eliminar el usuario.');
    }
  };

  return (
    <section className="mx-auto w-full max-w-7xl">
      <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
        <header className="mb-5">
          <h2 className="text-2xl font-bold text-slate-800">Gestion de Usuarios</h2>
          <p className="mt-1 text-sm text-slate-500">Crea y administra usuarios del sistema asignando un rol existente.</p>
        </header>

        <form onSubmit={handleSubmit} className="mb-6 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="Username"
            className="rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-sky-500"
          />

          <input
            type="text"
            name="password_hash"
            value={formData.password_hash}
            onChange={handleChange}
            placeholder="Password"
            className="rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-sky-500"
          />

          <input
            type="text"
            name="nombre_completo"
            value={formData.nombre_completo}
            onChange={handleChange}
            placeholder="Nombre completo"
            className="rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-sky-500"
          />

          <select
            name="id_rol"
            value={formData.id_rol}
            onChange={handleChange}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none transition focus:border-sky-500"
          >
            <option value="">Selecciona rol</option>
            {roles.map((rol) => (
              <option key={rol.id_rol ?? rol.id} value={rol.id_rol ?? rol.id}>
                {rol.nombre_rol}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <select
              name="estado"
              value={formData.estado}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none transition focus:border-sky-500"
            >
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Guardando...' : 'Crear'}
            </button>
          </div>
        </form>

        {error && (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <div className="overflow-x-auto max-w-full rounded-xl border border-slate-200">
          <table className="min-w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="px-4 py-3 font-semibold">ID</th>
                <th className="px-4 py-3 font-semibold">Username</th>
                <th className="px-4 py-3 font-semibold">Nombre</th>
                <th className="px-4 py-3 font-semibold">Rol</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                    Cargando usuarios...
                  </td>
                </tr>
              ) : usuarios.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                    No hay usuarios registrados.
                  </td>
                </tr>
              ) : (
                usuarios.map((usuario) => {
                  const id = usuario.id_usuario ?? usuario.id;
                  const rolId = Number(usuario.id_rol?.id_rol ?? usuario.id_rol);
                  const rol = roles.find((r) => Number(r.id_rol ?? r.id) === rolId);

                  return (
                    <tr key={id} className="border-t border-slate-100">
                      <td className="px-4 py-3 text-slate-700">{id}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{usuario.username}</td>
                      <td className="px-4 py-3 text-slate-700">{usuario.nombre_completo}</td>
                      <td className="px-4 py-3 text-slate-700">{rol?.nombre_rol || rolId || '-'}</td>
                      <td className="px-4 py-3 text-slate-700">{usuario.estado || '-'}</td>
                      <td className="px-4 py-3">
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
