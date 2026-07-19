"use client";

import AdminPaymentsPage from "@/components/admin/AdminPaymentsPage";
import AdminSubscriptionsPage from "@/components/admin/AdminSubscriptionsPage";
import RoleProtectedRoute from "@/components/auth/RoleProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { hasAllowedRole } from "@/lib/authRoles";

export default function Page() {
  const { user } = useAuth();
  const isAdmin = hasAllowedRole(user, ["admin"]);

  return (
    <RoleProtectedRoute allowedRoles={["admin", "parent", "child"]}>
      {isAdmin ? <AdminSubscriptionsPage /> : <AdminPaymentsPage />}
    </RoleProtectedRoute>
  );
}
