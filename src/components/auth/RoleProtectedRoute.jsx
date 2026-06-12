"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ADMIN_ROLES, hasAllowedRole } from "@/lib/authRoles";

export default function RoleProtectedRoute({
  children,
  allowedRoles = ADMIN_ROLES,
  fallback = null,
  unauthorizedRedirect = "/",
}) {
  const { isAuthenticated, isInitialized, redirectToLogin, user } = useAuth();
  const router = useRouter();
  const isAllowed = hasAllowedRole(user, allowedRoles);

  useEffect(() => {
    if (!isInitialized) return;

    if (!isAuthenticated) {
      redirectToLogin();
      return;
    }

    if (!isAllowed) {
      router.replace(unauthorizedRedirect);
    }
  }, [
    isAllowed,
    isAuthenticated,
    isInitialized,
    redirectToLogin,
    router,
    unauthorizedRedirect,
  ]);

  if (!isInitialized || !isAuthenticated || !isAllowed) {
    return fallback;
  }

  return children;
}
