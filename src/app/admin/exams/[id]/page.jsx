import AdminExamDetailPage from "@/components/admin/AdminExamDetailPage";
import RoleProtectedRoute from "@/components/auth/RoleProtectedRoute";

export default function Page({ params }) {
  return (
    <RoleProtectedRoute allowedRoles={["admin", "parent"]}>
      <AdminExamDetailPage examId={params.id} />
    </RoleProtectedRoute>
  );
}
