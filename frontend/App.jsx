import { useEffect, useMemo, useState } from 'react';
import CategoriaManager from './CategoriaManager';
import ClienteManager from './ClienteManager';
import ProductoManager from './ProductoManager';
import InventarioDashboard from './InventarioDashboard';
import UsuarioManager from './UsuarioManager';
import RolManager from './RolManager';
import CajaManager from './src/components/CajaManager';
import BitacoraManager from './src/components/BitacoraManager';
import Perfil from './src/components/Perfil';
import Login from './src/components/Login';
import TiendaPublica from './src/components/TiendaPublica';
import { useAuth } from './src/context/AuthContext';

const ROLE_ADMIN = 1;
const ROLE_VENDEDOR = 2;
const ROLE_CLIENTE = 3;

const NAV_ITEMS = [
  { key: 'categorias', label: 'Categorias', icon: '📂', allowedRoles: [ROLE_ADMIN] },
  { key: 'clientes', label: 'Clientes', icon: '👥', allowedRoles: [ROLE_ADMIN, ROLE_VENDEDOR] },
  { key: 'productos', label: 'Productos', icon: '🧴', allowedRoles: [ROLE_ADMIN, ROLE_VENDEDOR] },
  { key: 'caja', label: 'Caja / Ventas', icon: '🛒', allowedRoles: [ROLE_ADMIN, ROLE_VENDEDOR] },
  { key: 'inventario', label: 'Inventario', icon: '📦', allowedRoles: [ROLE_ADMIN, ROLE_VENDEDOR] },
  { key: 'usuarios', label: 'Usuarios', icon: '🧑‍💼', allowedRoles: [ROLE_ADMIN] },
  { key: 'roles', label: 'Roles', icon: '🛡️', allowedRoles: [ROLE_ADMIN] },
  { key: 'bitacora', label: 'Bitacora', icon: '📝', allowedRoles: [ROLE_ADMIN] },
  { key: 'perfil', label: 'Mi Perfil', icon: '👤', allowedRoles: [ROLE_ADMIN, ROLE_VENDEDOR] },
];

export default function App() {
  const { user, isReady, isAuthenticated, logout } = useAuth();
  const [activeView, setActiveView] = useState('inventario');
  const [publicView, setPublicView] = useState('store');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const userRolId = useMemo(() => {
    if (!user) return null;
    const roleCandidates = [
      user?.id_rol?.id_rol,
      user?.id_rol,
      user?.rol?.id_rol,
      user?.rol,
      user?.role?.id_rol,
      user?.role,
      user?.role_id,
      user?.idRol,
    ];

    for (const roleValue of roleCandidates) {
      const parsed = Number(roleValue);
      if (Number.isFinite(parsed) && parsed > 0) {
        return parsed;
      }
    }

    return null;
  }, [user]);

  const visibleNavItems = useMemo(() => {
    if (!userRolId) {
      return [];
    }

    return NAV_ITEMS.filter((item) => item.allowedRoles.includes(userRolId));
  }, [userRolId]);

  const allowedViewKeys = useMemo(() => {
    return new Set(visibleNavItems.map((item) => item.key));
  }, [visibleNavItems]);

  const defaultAllowedView = useMemo(() => {
    if (allowedViewKeys.has('inventario')) {
      return 'inventario';
    }

    if (allowedViewKeys.has('caja')) {
      return 'caja';
    }

    return visibleNavItems[0]?.key || null;
  }, [allowedViewKeys, visibleNavItems]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    if (!allowedViewKeys.has(activeView) && defaultAllowedView) {
      setActiveView(defaultAllowedView);
    }
  }, [activeView, allowedViewKeys, defaultAllowedView, isAuthenticated]);

  const activeLabel = useMemo(() => {
    const item = visibleNavItems.find((n) => n.key === activeView);
    return item ? item.label : 'Panel';
  }, [activeView, visibleNavItems]);

  const renderActiveView = () => {
    if (!allowedViewKeys.has(activeView)) {
      return <div className="p-10 text-center text-red-500 font-bold">Acceso Denegado</div>;
    }

    switch (activeView) {
      case 'categorias':
        return <CategoriaManager />;
      case 'clientes':
        return <ClienteManager />;
      case 'productos':
        return <ProductoManager />;
      case 'caja':
        return <CajaManager />;
      case 'inventario':
        return <InventarioDashboard />;
      case 'usuarios':
        return <UsuarioManager />;
      case 'roles':
        return <RolManager />;
      case 'bitacora':
        return <BitacoraManager />;
      case 'perfil':
        return <Perfil />;
      default:
        return <div className="p-10 text-center text-red-500 font-bold">Acceso Denegado</div>;
    }
  };

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-600">
        Cargando sesion...
      </div>
    );
  }

  if (!isAuthenticated || userRolId === ROLE_CLIENTE) {
    if (publicView === 'store') {
      return (
        <TiendaPublica 
          onAccesoPersonal={() => setPublicView('login')} 
          user={user} 
          logout={logout}
          isAuthenticated={isAuthenticated}
        />
      );
    }

    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setPublicView('store')}
          className="absolute left-4 top-4 z-30 rounded-full border border-slate-300 bg-white/95 px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 sm:left-6 sm:top-6"
        >
          Volver a Tienda
        </button>
        <Login onSuccess={() => setPublicView('store')} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className={`fixed inset-y-0 left-0 z-40 w-72 transform overflow-y-auto bg-slate-900 px-5 py-6 text-slate-100 transition-transform duration-300 lg:static lg:w-auto lg:translate-x-0 ${mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}>
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(56,189,248,0.18),transparent_45%)]" />
          <div className="relative">
            <div className="mb-4 sm:mb-8 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-sky-300">Cosmetics Suite</p>
                <h1 className="mt-2 text-2xl font-bold leading-tight">Panel</h1>
              </div>
              <button 
                type="button" 
                className="lg:hidden p-2 text-slate-400 hover:text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                ✕
              </button>
            </div>

            <nav className="space-y-2 mt-4 sm:mt-0">
              {visibleNavItems.map((item) => {
                const isActive = activeView === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => { setActiveView(item.key); setMobileMenuOpen(false); }}
                    className={[
                      'flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition',
                      isActive
                        ? 'bg-sky-500/20 text-white ring-1 ring-sky-400/40'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white',
                    ].join(' ')}
                  >
                    <span className="text-lg" aria-hidden="true">
                      {item.icon}
                    </span>
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}

              {visibleNavItems.length === 0 && (
                <div className="rounded-xl border border-red-300 bg-red-500/10 px-3 py-3 text-sm font-semibold text-red-100">
                  Tu rol no tiene modulos asignados.
                </div>
              )}
            </nav>
          </div>
        </aside>

        {/* Mobile Backdrop */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-30 bg-slate-900/50 backdrop-blur-sm lg:hidden transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        <main className="min-w-0 flex-1 w-full max-w-full">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur w-full">
            <div className="mx-auto flex w-full max-w-[1500px] items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="lg:hidden flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>
                <div className="min-w-0 flex-1">
                  <p className="hidden sm:block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Modulo</p>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-800 line-clamp-1 break-all">{activeLabel}</h2>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                <div className="hidden md:flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] sm:text-xs font-semibold text-emerald-700">
                  Online
                </div>
                <div className="hidden lg:flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 max-w-[150px] truncate">
                  {user?.username || 'Usuario'}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setPublicView('store');
                  }}
                  className="rounded-full border border-slate-300 px-3 py-1.5 sm:py-1 text-xs font-semibold text-slate-700 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700 whitespace-nowrap"
                >
                  Salir
                </button>
              </div>
            </div>
          </header>

          <div className="mx-auto w-full max-w-[1500px] p-4 sm:p-6 overflow-x-hidden">{renderActiveView()}</div>
        </main>
      </div>
    </div>
  );
}
