import {
  ROLE_ADMIN,
  ROLE_AUDITOR,
  ROLE_BODEGUERO,
  ROLE_COMPRAS,
  ROLE_VENDEDOR,
} from '../utils/roleUtils';

/** Ítems del panel (sin Mi Perfil — va fijo al pie del sidebar). */
export const NAV_SECTIONS = [
  {
    id: 'ventas',
    title: 'Ventas',
    items: [
      { key: 'caja', label: 'Caja / Ventas', icon: '🛒', allowedRoles: [ROLE_ADMIN, ROLE_VENDEDOR] },
      { key: 'pedidos_online', label: 'Pedidos Online', icon: '🛍️', allowedRoles: [ROLE_ADMIN, ROLE_VENDEDOR] },
      { key: 'clientes', label: 'Clientes', icon: '👥', allowedRoles: [ROLE_ADMIN, ROLE_VENDEDOR] },
      { key: 'envios', label: 'Logistica / Envios', icon: '🚚', allowedRoles: [ROLE_ADMIN, ROLE_VENDEDOR] },
    ],
  },
  {
    id: 'catalogo',
    title: 'Catalogo',
    items: [
      { key: 'categorias', label: 'Categorias', icon: '📂', allowedRoles: [ROLE_ADMIN] },
      { key: 'productos', label: 'Productos', icon: '🧴', allowedRoles: [ROLE_ADMIN, ROLE_VENDEDOR, ROLE_BODEGUERO, ROLE_COMPRAS] },
    ],
  },
  {
    id: 'abastecimiento',
    title: 'Abastecimiento',
    items: [
      { key: 'proveedores', label: 'Proveedores', icon: '🏭', allowedRoles: [ROLE_ADMIN, ROLE_COMPRAS] },
      { key: 'compras', label: 'Compras', icon: '📥', allowedRoles: [ROLE_ADMIN, ROLE_COMPRAS] },
    ],
  },
  {
    id: 'inventario',
    title: 'Inventario',
    items: [
      { key: 'inventario', label: 'Inventario', icon: '📦', allowedRoles: [ROLE_ADMIN, ROLE_VENDEDOR, ROLE_BODEGUERO, ROLE_COMPRAS] },
    ],
  },
  {
    id: 'reportes',
    title: 'Reportes',
    items: [
      { key: 'dashboard', label: 'Dashboard', icon: '📊', allowedRoles: [ROLE_ADMIN] },
      { key: 'productos_top', label: 'Productos Top', icon: '🏆', allowedRoles: [ROLE_ADMIN, ROLE_VENDEDOR] },
      { key: 'clientes_frecuentes', label: 'Clientes TOP', icon: '⭐', allowedRoles: [ROLE_ADMIN] },
      { key: 'alertas_predictivas', label: 'Alertas Stock', icon: '⚠️', allowedRoles: [ROLE_ADMIN] },
      { key: 'tendencias', label: 'Tendencias', icon: '📈', allowedRoles: [ROLE_ADMIN] },
    ],
  },
  {
    id: 'administracion',
    title: 'Administracion',
    items: [
      { key: 'usuarios', label: 'Usuarios', icon: '🧑‍💼', allowedRoles: [ROLE_ADMIN] },
      { key: 'roles', label: 'Roles', icon: '🛡️', allowedRoles: [ROLE_ADMIN] },
      { key: 'bitacora', label: 'Bitacora', icon: '📝', allowedRoles: [ROLE_ADMIN, ROLE_AUDITOR] },
    ],
  },
];

export const PERFIL_NAV_ITEM = {
  key: 'perfil',
  label: 'Mi Perfil',
  icon: '👤',
  allowedRoles: [ROLE_ADMIN, ROLE_VENDEDOR, ROLE_BODEGUERO, ROLE_COMPRAS, ROLE_AUDITOR],
};

export function buildVisibleNavigation(roleId) {
  if (!roleId) {
    return { sections: [], perfilVisible: false, flatItems: [] };
  }

  const sections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => item.allowedRoles.includes(roleId)),
  })).filter((section) => section.items.length > 0);

  const perfilVisible = PERFIL_NAV_ITEM.allowedRoles.includes(roleId);
  const flatItems = [
    ...sections.flatMap((section) => section.items),
    ...(perfilVisible ? [PERFIL_NAV_ITEM] : []),
  ];

  return { sections, perfilVisible, flatItems };
}
