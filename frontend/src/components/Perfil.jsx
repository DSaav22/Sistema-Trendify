import { useEffect, useMemo, useState } from 'react';

import api from '../utils/api';
import { evaluatePasswordRules, validatePassword } from '../utils/passwordValidation';
import { useAuth } from '../context/AuthContext';
import UserAvatar from './UserAvatar';

const ROLE_LABELS = {
  1: 'Administrador',
  2: 'Vendedor',
  3: 'Bodeguero',
  4: 'Compras',
  5: 'Auditor',
  6: 'Cliente',
};
const LOYALTY_CONFIG_URL = '/api/lealtad/config/';

function extractRoleId(user) {
  if (!user) return null;
  const candidates = [
    user?.id_rol?.id_rol,
    user?.id_rol,
    user?.rol?.id_rol,
    user?.rol,
    user?.role_id,
  ];
  for (const value of candidates) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return null;
}

export default function Perfil() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    password_actual: '',
    password_nuevo: '',
  });
  const [saving, setSaving] = useState(false);
  const [loyaltySaving, setLoyaltySaving] = useState(false);
  const [loyaltyLoading, setLoyaltyLoading] = useState(false);
  const [loyaltyError, setLoyaltyError] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loyaltyConfig, setLoyaltyConfig] = useState(null);

  const roleId = useMemo(() => extractRoleId(user), [user]);
  const roleLabel = ROLE_LABELS[roleId] || user?.id_rol?.nombre_rol || 'Usuario';
  const passwordChecks = useMemo(
    () => evaluatePasswordRules(formData.password_nuevo),
    [formData.password_nuevo],
  );
  const passwordValida = passwordChecks.every((rule) => rule.ok);

  useEffect(() => {
    let active = true;
    async function cargarLealtad() {
      if (roleId !== 1) return;
      setLoyaltyLoading(true);
      setLoyaltyError('');
      try {
        const { data } = await api.get(LOYALTY_CONFIG_URL);
        if (active) setLoyaltyConfig(data);
      } catch (err) {
        if (active) {
          console.error('Error cargando configuracion de lealtad:', err);
          setLoyaltyError('No se pudo cargar la configuracion del programa de lealtad.');
        }
      } finally {
        if (active) {
          setLoyaltyLoading(false);
        }
      }
    }
    cargarLealtad();
    return () => {
      active = false;
    };
  }, [roleId]);

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

    const validacion = validatePassword(formData.password_nuevo);
    if (!validacion.valid) {
      setError(validacion.message);
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

  const handleLoyaltyChange = (section, field, value, index = null) => {
    setLoyaltyConfig((prev) => {
      if (!prev) return prev;
      if (section === 'points') {
        return {
          ...prev,
          points: {
            ...prev.points,
            [field]: value,
          },
        };
      }

      if (section === 'dynamic_discounts' && index !== null) {
        return {
          ...prev,
          dynamic_discounts: prev.dynamic_discounts.map((item, itemIndex) => (
            itemIndex === index ? { ...item, [field]: value } : item
          )),
        };
      }

      return prev;
    });
  };

  const guardarLealtad = async () => {
    if (!loyaltyConfig) return;
    setError('');
    setSuccess('');
    setLoyaltySaving(true);
    try {
      const { data } = await api.patch(LOYALTY_CONFIG_URL, loyaltyConfig);
      setLoyaltyConfig(data);
      setSuccess('Programa de lealtad actualizado correctamente.');
    } catch (err) {
      console.error('Error actualizando programa de lealtad:', err);
      setError(err?.response?.data?.detail || 'No se pudo actualizar la configuracion de lealtad.');
    } finally {
      setLoyaltySaving(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-3xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Mi Perfil</h2>
        <p className="mt-1 text-sm text-slate-500">
          Datos de tu cuenta y cambio de contrasena del panel administrativo.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-[1fr_1.1fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <UserAvatar username={user?.username} size="lg" />
            <div className="min-w-0">
              <p className="truncate text-lg font-bold text-slate-900">{user?.nombre_completo || user?.username || '-'}</p>
              <p className="truncate text-sm text-slate-500">@{user?.username || '-'}</p>
            </div>
          </div>

          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between gap-3 border-b border-slate-100 pb-2">
              <dt className="text-slate-500">Rol</dt>
              <dd className="font-semibold text-slate-800">{roleLabel}</dd>
            </div>
            <div className="flex justify-between gap-3 border-b border-slate-100 pb-2">
              <dt className="text-slate-500">Estado</dt>
              <dd className="font-semibold text-emerald-700">{user?.estado || 'activo'}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">ID usuario</dt>
              <dd className="font-semibold text-slate-800">#{user?.id_usuario ?? user?.id ?? '-'}</dd>
            </div>
          </dl>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <header className="mb-4">
            <h3 className="text-lg font-bold text-slate-800">Cambiar contrasena</h3>
            <p className="mt-1 text-sm text-slate-500">Por seguridad, confirma tu contrasena actual.</p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Contrasena actual</span>
              <input
                type="password"
                name="password_actual"
                value={formData.password_actual}
                onChange={handleChange}
                className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none transition focus:ring-2 focus:ring-slate-800"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Nueva contrasena</span>
              <p className="mt-0.5 text-xs text-slate-500">
                Debe incluir mayusculas, minusculas, numeros y un simbolo. No se permiten contrasenas solo numericas.
              </p>
              <input
                type="password"
                name="password_nuevo"
                value={formData.password_nuevo}
                onChange={handleChange}
                minLength={8}
                autoComplete="new-password"
                className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none transition focus:ring-2 focus:ring-slate-800"
              />
              {formData.password_nuevo.length > 0 && (
                <ul className="mt-2 space-y-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
                  {passwordChecks.map((rule) => (
                    <li
                      key={rule.id}
                      className={rule.ok ? 'text-emerald-700' : 'text-slate-500'}
                    >
                      {rule.ok ? '✓' : '○'} {rule.label}
                    </li>
                  ))}
                </ul>
              )}
            </label>

            {error && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            )}

            {success && (
              <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p>
            )}

            <button
              type="submit"
              disabled={saving || (formData.password_nuevo.length > 0 && !passwordValida)}
              className="w-full rounded-lg bg-slate-900 px-4 py-2.5 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Guardando...' : 'Cambiar contrasena'}
            </button>
          </form>
        </article>
      </div>

      {roleId === 1 && (
        <article className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
          <header className="mb-4">
            <h3 className="text-lg font-bold text-slate-800">Programa de lealtad</h3>
            <p className="mt-1 text-sm text-slate-600">
              Ajusta reglas de puntos y descuentos dinamicos que se aplican en tienda y caja.
            </p>
          </header>

          {loyaltyLoading ? (
            <p className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
              Cargando configuracion de lealtad...
            </p>
          ) : loyaltyError ? (
            <div>
              <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {loyaltyError}
              </p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-4 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Reintentar
              </button>
            </div>
          ) : loyaltyConfig ? (
            <>
              <div className="grid gap-4 lg:grid-cols-3">
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Monto por punto (BOB)</span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={loyaltyConfig.points?.amount_per_point || '10.00'}
                    onChange={(event) => handleLoyaltyChange('points', 'amount_per_point', event.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none transition focus:ring-2 focus:ring-amber-400"
                  />
                </label>

                {loyaltyConfig.dynamic_discounts?.map((rule, index) => (
                  <div key={`${rule.name}-${index}`} className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="font-semibold text-slate-800">{rule.name}</p>
                    <label className="mt-3 block">
                      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Minimo de compra</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={rule.min_amount}
                        onChange={(event) => handleLoyaltyChange('dynamic_discounts', 'min_amount', event.target.value, index)}
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                      />
                    </label>
                    <label className="mt-3 block">
                      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Porcentaje</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={rule.percent}
                        onChange={(event) => handleLoyaltyChange('dynamic_discounts', 'percent', event.target.value, index)}
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                      />
                    </label>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={guardarLealtad}
                disabled={loyaltySaving}
                className="mt-5 rounded-lg bg-amber-500 px-4 py-2.5 font-semibold text-slate-900 transition hover:bg-amber-400 disabled:opacity-60"
              >
                {loyaltySaving ? 'Guardando reglas...' : 'Guardar programa de lealtad'}
              </button>
            </>
          ) : (
            <p className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
              No hay configuracion de lealtad disponible todavia.
            </p>
          )}
        </article>
      )}
    </section>
  );
}
