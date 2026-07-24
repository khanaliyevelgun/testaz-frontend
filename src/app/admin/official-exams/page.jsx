import ChildOfficialExamsPage from "@/components/admin/ChildOfficialExamsPage";
import RoleProtectedRoute from "@/components/auth/RoleProtectedRoute";

export default function Page() {
  return (
    <RoleProtectedRoute allowedRoles={["child"]}>
      <ChildOfficialExamsPage />
    </RoleProtectedRoute>
  );
}
