import AdminSubscriptionPlansPage from "@/components/admin/AdminSubscriptionPlansPage";
import RoleProtectedRoute from "@/components/auth/RoleProtectedRoute";

export default function Page() {
  return (
    <RoleProtectedRoute allowedRoles={["admin"]}>
      <AdminSubscriptionPlansPage />
    </RoleProtectedRoute>
  );
}
