import AdminExamAttemptsPage from "@/components/admin/AdminExamAttemptsPage";
import RoleProtectedRoute from "@/components/auth/RoleProtectedRoute";

export default function Page({ params }) {
  return (
    <RoleProtectedRoute allowedRoles={["admin", "parent"]}>
      <AdminExamAttemptsPage examId={params.id} />
    </RoleProtectedRoute>
  );
}
