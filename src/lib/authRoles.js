export const ORGANIZATION_ROLES = ["course", "private_tutor", "school_teacher"];
export const ADMIN_ROLES = ["admin", "parent", "child", ...ORGANIZATION_ROLES];

export const normalizeRole = (role) => {
  const normalizedRole = String(role || "").toLowerCase();
  if (normalizedRole === "student") return "child";
  return normalizedRole;
};

export const getUserRoles = (user) => {
  if (!user) return [];

  const roles = user.roles || user.role || user.type || user.accountType;
  if (Array.isArray(roles)) return roles.map(normalizeRole);
  if (roles) return [normalizeRole(roles)];

  return [];
};

export const getPrimaryRole = (user) => {
  const roles = getUserRoles(user);
  if (roles.some((role) => ORGANIZATION_ROLES.includes(role))) return "organization";
  return ADMIN_ROLES.find((role) => roles.includes(role)) || roles[0] || null;
};

export const hasAllowedRole = (user, allowedRoles = ADMIN_ROLES) => {
  const roles = getUserRoles(user);
  const normalizedAllowedRoles = allowedRoles.flatMap((role) =>
    role === "organization" ? ORGANIZATION_ROLES : [normalizeRole(role)]
  );
  return normalizedAllowedRoles.some((role) => roles.includes(role));
};

const routeRoles = [
  { pattern: /^\/admin\/users(?:\/|$)/, roles: ["admin"] },
  { pattern: /^\/admin\/courses(?:\/|$)/, roles: ["admin"] },
  { pattern: /^\/admin\/reports(?:\/|$)/, roles: ["admin"] },
  { pattern: /^\/admin\/audit(?:\/|$)/, roles: ["admin"] },
  { pattern: /^\/admin\/subscription-plans(?:\/|$)/, roles: ["admin"] },
  { pattern: /^\/admin\/payments(?:\/|$)/, roles: ["admin"] },
  { pattern: /^\/admin\/subscriptions(?:\/|$)/, roles: ["admin", "parent", "child"] },
  { pattern: /^\/admin\/organizations(?:\/|$)/, roles: ["organization"] },
  { pattern: /^\/admin\/members(?:\/|$)/, roles: ["organization"] },
  { pattern: /^\/admin\/invites(?:\/|$)/, roles: ["organization"] },
  { pattern: /^\/admin\/children(?:\/|$)/, roles: ["parent"] },
  { pattern: /^\/admin\/progress(?:\/|$)/, roles: ["parent"] },
  { pattern: /^\/admin\/parent(?:\/|$)/, roles: ["parent"] },
  { pattern: /^\/admin\/exams\/take(?:\/|$)/, roles: ["child"] },
  { pattern: /^\/admin\/exam-session(?:\/|$)/, roles: ["child"] },
  { pattern: /^\/admin\/exams(?:\/|$)/, roles: ["admin", "parent"] },
  { pattern: /^\/admin\/child(?:\/|$)/, roles: ["child"] },
  { pattern: /^\/admin\/my-courses(?:\/|$)/, roles: ["child"] },
  { pattern: /^\/admin\/assignments(?:\/|$)/, roles: ["child"] },
  { pattern: /^\/admin\/quiz-attempts(?:\/|$)/, roles: ["child"] },
  { pattern: /^\/admin\/wishlist(?:\/|$)/, roles: ["child"] },
  { pattern: /^\/admin\/profile(?:\/|$)/, roles: ADMIN_ROLES },
  { pattern: /^\/admin\/settings(?:\/|$)/, roles: ADMIN_ROLES },
  { pattern: /^\/admin(?:\/)?$/, roles: ADMIN_ROLES },
  { pattern: /^\/admin\/notifications(?:\/|$)/, roles: ADMIN_ROLES },
  { pattern: /^\/admin\/messages(?:\/|$)/, roles: ADMIN_ROLES },
];

export const getAllowedRolesForPath = (pathname) =>
  routeRoles.find((route) => route.pattern.test(pathname))?.roles || ["admin"];
