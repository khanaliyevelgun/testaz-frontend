import OrganizationMembersPage from "@/components/admin/OrganizationMembersPage";
import RoleProtectedRoute from "@/components/auth/RoleProtectedRoute";

export default function Page() {
  return (
    <RoleProtectedRoute allowedRoles={["organization"]}>
      <OrganizationMembersPage />
    </RoleProtectedRoute>
  );
}
