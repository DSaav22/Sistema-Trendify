from rest_framework.permissions import BasePermission


ROLE_ADMIN = 1
ROLE_VENDEDOR = 2
ROLE_CLIENTE = 3


def extract_user_role_id(user):
    if user is None:
        return None

    if not getattr(user, 'is_authenticated', False):
        return None

    candidates = [
        getattr(user, 'id_rol_id', None),
        getattr(getattr(user, 'id_rol', None), 'id_rol', None),
        getattr(user, 'id_rol', None),
        getattr(user, 'role_id', None),
        getattr(getattr(user, 'role', None), 'id_rol', None),
        getattr(user, 'role', None),
    ]

    for value in candidates:
        try:
            parsed = int(value)
        except (TypeError, ValueError):
            continue

        if parsed > 0:
            return parsed

    return None


class RoleBasedPermission(BasePermission):
    allowed_roles = tuple()
    message = 'No tienes permisos para acceder a este recurso.'

    def has_permission(self, request, view):
        role_id = extract_user_role_id(getattr(request, 'user', None))
        return role_id in self.allowed_roles


class IsAdminRole(RoleBasedPermission):
    allowed_roles = (ROLE_ADMIN,)


class IsAdminOrVendedorRole(RoleBasedPermission):
    allowed_roles = (ROLE_ADMIN, ROLE_VENDEDOR)


class IsClienteRole(RoleBasedPermission):
    allowed_roles = (ROLE_CLIENTE,)
