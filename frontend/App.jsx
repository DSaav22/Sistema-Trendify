import { useMemo, useState } from 'react';
import CategoriaManager from './CategoriaManager';
import ClienteManager from './ClienteManager';
import ProductoManager from './ProductoManager';
import InventarioDashboard from './InventarioDashboard';

const NAV_ITEMS = [
  { key: 'categorias', label: 'Categorias', icon: '📂' },
  { key: 'clientes', label: 'Clientes', icon: '👥' },
  { key: 'productos', label: 'Productos', icon: '🧴' },
  { key: 'inventario', label: 'Inventario', icon: '📦' },
];

export default function App() {
  const [activeView, setActiveView] = useState('inventario');

  const activeLabel = useMemo(() => {
    const item = NAV_ITEMS.find((n) => n.key === activeView);
    return item ? item.label : 'Panel';
  }, [activeView]);

  const renderActiveView = () => {
    switch (activeView) {
      case 'categorias':
        return <CategoriaManager />;
      case 'clientes':
        return <ClienteManager />;
      case 'productos':
        return <ProductoManager />;
      case 'inventario':
      default:
        return <InventarioDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="relative overflow-hidden bg-slate-900 px-5 py-6 text-slate-100">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(56,189,248,0.18),transparent_45%)]" />
          <div className="relative">
            <div className="mb-8">
              <p className="text-xs uppercase tracking-[0.28em] text-sky-300">Cosmetics Suite</p>
              <h1 className="mt-2 text-2xl font-bold leading-tight">Panel Administrativo</h1>
              <p className="mt-2 text-sm text-slate-300">Ventas, clientes, productos e inventario en una sola vista.</p>
            </div>

            <nav className="space-y-2">
              {NAV_ITEMS.map((item) => {
                const isActive = activeView === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => setActiveView(item.key)}
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
            </nav>
          </div>
        </aside>

        <main className="min-w-0">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="mx-auto flex max-w-[1500px] items-center justify-between px-6 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Modulo Activo</p>
                <h2 className="text-xl font-bold text-slate-800">{activeLabel}</h2>
              </div>
              <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                API Online
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-[1500px] p-4 md:p-6">{renderActiveView()}</div>
        </main>
      </div>
    </div>
  );
}
