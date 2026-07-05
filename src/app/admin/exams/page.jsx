import AdminExamsPage from "@/components/admin/AdminExamsPage";
import RoleProtectedRoute from "@/components/auth/RoleProtectedRoute";

export default function Page() {
  return (
    <RoleProtectedRoute allowedRoles={["admin", "parent"]}>
      <AdminExamsPage />
    </RoleProtectedRoute>
  );
}
