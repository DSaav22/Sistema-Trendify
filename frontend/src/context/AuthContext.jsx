import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import api, { AUTH_STORAGE_KEY } from '../utils/api';

const AuthContext = createContext(null);

function readStoredSession() {
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (error) {
    console.warn('Sesion local invalida:', error);
    return null;
  }
}

function normalizeLoginPayload(data) {
  const token = data?.access || data?.access_token || '';
  const refreshToken = data?.refresh || data?.refresh_token || '';

  const userFromPayload = data?.usuario || null;
  const fallbackUser = {
    id_usuario: data?.id_usuario,
    username: data?.username,
    id_rol: data?.id_rol,
  };

  const user = userFromPayload || fallbackUser;

  if (!token || !user?.id_usuario || !user?.username) {
    throw new Error('La respuesta de autenticacion no contiene los campos esperados.');
  }

  return { token, refreshToken, user };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState('');
  const [refreshToken, setRefreshToken] = useState('');
  const [isReady, setIsReady] = useState(false);

  const clearSession = useCallback(() => {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    setUser(null);
    setToken('');
    setRefreshToken('');
  }, []);

  const saveSession = useCallback((nextSession) => {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextSession));
    setUser(nextSession.user);
    setToken(nextSession.token);
    setRefreshToken(nextSession.refreshToken || '');
  }, []);

  useEffect(() => {
    const stored = readStoredSession();
    if (stored?.token && stored?.user) {
      setUser(stored.user);
      setToken(stored.token);
      setRefreshToken(stored.refreshToken || '');
    }
    setIsReady(true);
  }, []);

  const logout = useCallback(
    async ({ callApi = true } = {}) => {
      const tokenToInvalidate = refreshToken || readStoredSession()?.refreshToken;

      if (callApi && tokenToInvalidate) {
        try {
          await api.post('/api/auth/logout/', { refresh_token: tokenToInvalidate });
        } catch (error) {
          // Si falla el logout remoto, siempre se prioriza cerrar sesion local.
        }
      }

      clearSession();
    },
    [clearSession, refreshToken]
  );

  useEffect(() => {
    const handleUnauthorized = () => {
      logout({ callApi: false });
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [logout]);

  const login = useCallback(
    async ({ username, password }) => {
      try {
        const { data } = await api.post('/api/auth/login/', { username, password });
        const session = normalizeLoginPayload(data);
        saveSession(session);
        return { ok: true };
      } catch (error) {
        const status = error?.response?.status;
        if (status === 401) {
          return { ok: false, message: 'Credenciales incorrectas.' };
        }
        if (status === 403) {
          return { ok: false, message: 'Usuario inactivo o sin permisos.' };
        }

        return { ok: false, message: 'No se pudo iniciar sesion. Intenta nuevamente.' };
      }
    },
    [saveSession]
  );

  const value = useMemo(
    () => ({
      user,
      token,
      isReady,
      isAuthenticated: Boolean(user && token),
      login,
      logout,
    }),
    [user, token, isReady, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider.');
  }
  return context;
}
