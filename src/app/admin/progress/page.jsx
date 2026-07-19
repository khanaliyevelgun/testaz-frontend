import ParentProgressPage from "@/components/admin/ParentProgressPage";
import RoleProtectedRoute from "@/components/auth/RoleProtectedRoute";

export default function Page() {
  return (
    <RoleProtectedRoute allowedRoles={["parent"]}>
      <ParentProgressPage />
    </RoleProtectedRoute>
  );
}
