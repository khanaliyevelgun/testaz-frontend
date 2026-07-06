import ParentChildrenPage from "@/components/admin/ParentChildrenPage";
import RoleProtectedRoute from "@/components/auth/RoleProtectedRoute";

export default function Page() {
  return (
    <RoleProtectedRoute allowedRoles={["parent", "child"]}>
      <ParentChildrenPage />
    </RoleProtectedRoute>
  );
}
