import OrganizationInvitesPage from "@/components/admin/OrganizationInvitesPage";
import RoleProtectedRoute from "@/components/auth/RoleProtectedRoute";

export default function Page() {
  return (
    <RoleProtectedRoute allowedRoles={["organization"]}>
      <OrganizationInvitesPage />
    </RoleProtectedRoute>
  );
}
