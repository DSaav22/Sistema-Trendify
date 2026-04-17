import axios from 'axios';

export const AUTH_STORAGE_KEY = 'si.auth.session';

const api = axios.create();

function readSession() {
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn('No se pudo leer la sesion local:', error);
    return null;
  }
}

api.interceptors.request.use((config) => {
  const session = readSession();
  const token = session?.token;

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const requestUrl = String(error?.config?.url || '');

    // Evita logout global por credenciales invalidas en el formulario de login.
    if (status === 401 && !requestUrl.includes('/api/auth/login/')) {
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }

    return Promise.reject(error);
  }
);

export default api;

/*
Manejo automatico de token expirado (401 Unauthorized):
1) El interceptor de respuesta detecta cualquier 401.
2) Dispara el evento global 'auth:unauthorized'.
3) AuthContext escucha ese evento, limpia localStorage y estado en memoria.
4) App vuelve a renderizar Login de forma inmediata, protegiendo el panel.
*/
