import OrganizationManagementPage from "@/components/admin/OrganizationManagementPage";
import RoleProtectedRoute from "@/components/auth/RoleProtectedRoute";

export default function Page() {
  return (
    <RoleProtectedRoute allowedRoles={["organization"]}>
      <OrganizationManagementPage />
    </RoleProtectedRoute>
  );
}
