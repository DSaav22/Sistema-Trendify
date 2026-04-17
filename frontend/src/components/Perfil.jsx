import { useState } from 'react';

import api from '../utils/api';

export default function Perfil() {
  const [formData, setFormData] = useState({
    password_actual: '',
    password_nuevo: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
    setSuccess('');

    if (!formData.password_actual || !formData.password_nuevo) {
      setError('Completa ambos campos de contrasena.');
      return;
    }

    setSaving(true);
    try {
      const { data } = await api.post('/api/auth/cambiar-password/', {
        password_actual: formData.password_actual,
        password_nuevo: formData.password_nuevo,
      });

      setSuccess(data?.detail || 'Contrasena actualizada correctamente.');
      setFormData({
        password_actual: '',
        password_nuevo: '',
      });
    } catch (err) {
      console.error('Error al cambiar contrasena:', err);
      setError(err?.response?.data?.detail || 'No se pudo cambiar la contrasena.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-lg">
      <div className="max-w-lg bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <header className="mb-5">
          <h2 className="text-2xl font-bold text-slate-800">Mi Perfil</h2>
          <p className="mt-1 text-sm text-slate-500">Actualiza tu contrasena de acceso al sistema.</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Contrasena Actual</span>
            <input
              type="password"
              name="password_actual"
              value={formData.password_actual}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none transition focus:ring-2 focus:ring-slate-800"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Nueva Contrasena</span>
            <input
              type="password"
              name="password_nuevo"
              value={formData.password_nuevo}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none transition focus:ring-2 focus:ring-slate-800"
            />
          </label>

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          {success && (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-slate-900 px-4 py-2.5 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Guardando...' : 'Cambiar Contrasena'}
          </button>
        </form>
      </div>
    </section>
  );
}
