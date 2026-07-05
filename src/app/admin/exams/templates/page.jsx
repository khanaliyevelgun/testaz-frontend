import AdminExamTemplatesPage from "@/components/admin/AdminExamTemplatesPage";
import RoleProtectedRoute from "@/components/auth/RoleProtectedRoute";

export default function Page() {
  return (
    <RoleProtectedRoute allowedRoles={["admin", "parent"]}>
      <AdminExamTemplatesPage />
    </RoleProtectedRoute>
  );
}
