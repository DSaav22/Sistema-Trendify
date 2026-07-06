import { useEffect, useMemo, useState } from 'react';
import useInactivityLogout from './src/hooks/useInactivityLogout';
import CategoriaManager from './CategoriaManager';
import ClienteManager from './ClienteManager';
import ProductoManager from './ProductoManager';
import ProveedoresManager from './ProveedoresManager';
import ComprasManager from './ComprasManager';
import InventarioDashboard from './InventarioDashboard';
import UsuarioManager from './UsuarioManager';
import RolManager from './RolManager';
import CajaManager from './src/components/CajaManager';
import PedidosOnlineManager from './src/components/PedidosOnlineManager';
import EnviosManager from './src/components/EnviosManager';
import BitacoraManager from './src/components/BitacoraManager';
import ReportesDashboard from './src/components/ReportesDashboard';
import ProductosTopView from './src/components/ProductosTopView';
import ClientesFrecuentesView from './src/components/ClientesFrecuentesView';
import AlertasPredictivasView from './src/components/AlertasPredictivasView';
import TendenciasView from './src/components/TendenciasView';
import AsistenteVoz from './src/components/AsistenteVoz';
import Perfil from './src/components/Perfil';
import Login from './src/components/Login';
import TiendaPublica from './src/components/TiendaPublica';
import UserAvatar from './src/components/UserAvatar';
import SessionExpiredModal from './src/components/SessionExpiredModal';
import { useAuth } from './src/context/AuthContext';
import { buildVisibleNavigation, PERFIL_NAV_ITEM } from './src/config/navConfig';
import {
  ROLE_ADMIN,
  ROLE_CLIENTE,
  ROLE_VENDEDOR,
  ROLE_LABELS,
  defaultViewForRole,
  extractRoleId,
} from './src/utils/roleUtils';

export default function App() {
  const { user, isReady, isAuthenticated, logout, expireByInactivity } = useAuth();
  const [activeView, setActiveView] = useState('');
  const [publicView, setPublicView] = useState('store');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const userRolId = useMemo(() => extractRoleId(user), [user]);

  const { sections: visibleSections, perfilVisible, flatItems: visibleNavItems } = useMemo(
    () => buildVisibleNavigation(userRolId),
    [userRolId],
  );

  const roleLabel = useMemo(() => {
    if (user?.nombre_rol) return user.nombre_rol;
    if (user?.id_rol?.nombre_rol) return user.id_rol.nombre_rol;
    return ROLE_LABELS[userRolId] || 'Usuario';
  }, [user, userRolId]);

  const allowedViewKeys = useMemo(() => {
    return new Set(visibleNavItems.map((item) => item.key));
  }, [visibleNavItems]);

  const inactivityEnabled = isAuthenticated && userRolId !== null && userRolId !== ROLE_CLIENTE;
  useInactivityLogout(expireByInactivity, inactivityEnabled);

  const defaultAllowedView = useMemo(() => {
    return defaultViewForRole(userRolId, allowedViewKeys) || visibleNavItems[0]?.key || null;
  }, [allowedViewKeys, visibleNavItems, userRolId]);

  useEffect(() => {
    if (!isAuthenticated || !defaultAllowedView) {
      return;
    }

    if (!allowedViewKeys.has(activeView)) {
      setActiveView(defaultAllowedView);
    }
  }, [activeView, allowedViewKeys, defaultAllowedView, isAuthenticated, user?.id_usuario]);

  const activeLabel = useMemo(() => {
    const item = visibleNavItems.find((n) => n.key === activeView);
    return item ? item.label : 'Panel';
  }, [activeView, visibleNavItems]);

  const renderActiveView = () => {
    if (!activeView) {
      return (
        <div className="flex min-h-[240px] items-center justify-center text-sm font-medium text-slate-500">
          Cargando modulo...
        </div>
      );
    }

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
      case 'proveedores':
        return <ProveedoresManager />;
      case 'compras':
        return <ComprasManager />;
      case 'caja':
        return <CajaManager />;
      case 'pedidos_online':
        return <PedidosOnlineManager />;
      case 'envios':
        return <EnviosManager />;
      case 'dashboard':
        return <ReportesDashboard onNavigate={setActiveView} />;
      case 'productos_top':
        return <ProductosTopView />;
      case 'clientes_frecuentes':
        return <ClientesFrecuentesView />;
      case 'alertas_predictivas':
        return <AlertasPredictivasView onNavigate={setActiveView} />;
      case 'tendencias':
        return <TendenciasView />;
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
        <>
          <TiendaPublica
            onAccesoPersonal={() => setPublicView('login')}
            user={user}
            logout={logout}
            isAuthenticated={isAuthenticated}
          />
          <SessionExpiredModal />
        </>
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
        <SessionExpiredModal />
      </div>
    );
  }

  const puedeUsarAsistente = userRolId === ROLE_ADMIN || userRolId === ROLE_VENDEDOR;

  const renderNavButton = (item) => {
    const isActive = activeView === item.key;
    return (
      <button
        key={item.key}
        type="button"
        onClick={() => {
          setActiveView(item.key);
          setMobileMenuOpen(false);
        }}
        className={[
          'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition',
          isActive
            ? 'bg-sky-500/20 text-white ring-1 ring-sky-400/40'
            : 'text-slate-300 hover:bg-white/10 hover:text-white',
        ].join(' ')}
      >
        <span className="text-lg" aria-hidden="true">
          {item.icon}
        </span>
        <span className="text-sm font-medium">{item.label}</span>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr] lg:items-stretch">
        <aside
          className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-slate-900 text-slate-100 transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:w-auto lg:translate-x-0 ${mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(56,189,248,0.18),transparent_45%)]" />
          <div className="relative flex min-h-0 flex-1 flex-col px-5 py-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-sky-300">Cosmetics Suite</p>
                <h1 className="mt-2 text-2xl font-bold leading-tight">Panel</h1>
                <p className="mt-1 text-xs font-medium text-slate-400">{roleLabel}</p>
              </div>
              <button
                type="button"
                className="p-2 text-slate-400 hover:text-white lg:hidden"
                onClick={() => setMobileMenuOpen(false)}
              >
                ✕
              </button>
            </div>

            <nav className="min-h-0 flex-1 space-y-5 overflow-y-auto pr-1">
              {visibleSections.map((section) => (
                <div key={section.id}>
                  <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {section.title}
                  </p>
                  <div className="space-y-1">{section.items.map((item) => renderNavButton(item))}</div>
                </div>
              ))}

              {visibleNavItems.length === 0 && (
                <div className="rounded-xl border border-red-300 bg-red-500/10 px-3 py-3 text-sm font-semibold text-red-100">
                  Tu rol no tiene modulos asignados.
                </div>
              )}
            </nav>

            {perfilVisible && (
              <div className="mt-4 border-t border-slate-700/80 pt-4">
                {renderNavButton(PERFIL_NAV_ITEM)}
              </div>
            )}
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
          <header className="relative z-10 border-b border-slate-200 bg-white w-full">
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
                <div className="hidden md:inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] sm:text-xs font-semibold text-emerald-700">
                  <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                  Online
                </div>
                <div className="hidden lg:flex items-center gap-2">
                  <UserAvatar username={user?.username} size="sm" />
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 max-w-[150px] truncate">
                    {user?.username || 'Usuario'}
                  </span>
                </div>
                <div className="lg:hidden">
                  <UserAvatar username={user?.username} size="sm" />
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
      <AsistenteVoz onNavigate={setActiveView} allowed={puedeUsarAsistente} />
      <SessionExpiredModal />
    </div>
  );
}
