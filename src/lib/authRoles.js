export const ADMIN_ROLES = ["admin", "parent", "child"];

export const getUserRoles = (user) => {
  if (!user) return [];

  const roles = user.roles || user.role || user.type || user.accountType;
  if (Array.isArray(roles)) return roles.map((role) => String(role).toLowerCase());
  if (roles) return [String(roles).toLowerCase()];

  return [];
};

export const getPrimaryRole = (user) => {
  const roles = getUserRoles(user);
  return ADMIN_ROLES.find((role) => roles.includes(role)) || roles[0] || null;
};

export const hasAllowedRole = (user, allowedRoles = ADMIN_ROLES) => {
  const roles = getUserRoles(user);
  return allowedRoles.some((role) => roles.includes(role));
};
