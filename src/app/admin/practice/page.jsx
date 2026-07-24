import ChildPracticePage from "@/components/admin/ChildPracticePage";
import RoleProtectedRoute from "@/components/auth/RoleProtectedRoute";

export default function Page() {
  return (
    <RoleProtectedRoute allowedRoles={["child"]}>
      <ChildPracticePage />
    </RoleProtectedRoute>
  );
}
