import ChildResultsPage from "@/components/admin/ChildResultsPage";
import RoleProtectedRoute from "@/components/auth/RoleProtectedRoute";

export default function Page() {
  return (
    <RoleProtectedRoute allowedRoles={["child"]}>
      <ChildResultsPage />
    </RoleProtectedRoute>
  );
}
