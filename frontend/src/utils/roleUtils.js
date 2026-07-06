export const ROLE_ADMIN = 1;
export const ROLE_VENDEDOR = 2;
export const ROLE_BODEGUERO = 3;
export const ROLE_COMPRAS = 4;
export const ROLE_AUDITOR = 5;
export const ROLE_CLIENTE = 6;

export const ROLE_LABELS = {
  [ROLE_ADMIN]: 'Administrador',
  [ROLE_VENDEDOR]: 'Vendedor',
  [ROLE_BODEGUERO]: 'Bodeguero',
  [ROLE_COMPRAS]: 'Compras',
  [ROLE_AUDITOR]: 'Auditor',
  [ROLE_CLIENTE]: 'Cliente',
};

/** Extrae id_rol numérico del usuario en sesión (misma lógica que backend). */
export function extractRoleId(user) {
  if (!user) return null;

  const candidates = [
    user.id_rol_id,
    user.id_rol?.id_rol,
    user.id_rol,
    user.rol?.id_rol,
    user.rol,
    user.role?.id_rol,
    user.role,
    user.role_id,
    user.idRol,
  ];

  for (const value of candidates) {
    const parsed = Number(value);
    if (Number.isInteger(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return null;
}

export function canAccessNavItem(item, roleId) {
  if (!roleId || !item?.allowedRoles) return false;
  return item.allowedRoles.includes(roleId);
}

export function defaultViewForRole(roleId, allowedKeys) {
  const prefer = {
    [ROLE_ADMIN]: ['dashboard', 'caja', 'inventario'],
    [ROLE_VENDEDOR]: ['caja', 'pedidos_online', 'clientes'],
    [ROLE_BODEGUERO]: ['inventario', 'productos'],
    [ROLE_COMPRAS]: ['compras', 'proveedores', 'productos'],
    [ROLE_AUDITOR]: ['bitacora', 'perfil'],
  };

  const candidates = prefer[roleId] || [];
  for (const key of candidates) {
    if (allowedKeys.has(key)) return key;
  }
  return candidates.find((key) => allowedKeys.has(key)) || null;
}
