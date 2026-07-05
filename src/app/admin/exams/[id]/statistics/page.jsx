import AdminExamStatisticsPage from "@/components/admin/AdminExamStatisticsPage";
import RoleProtectedRoute from "@/components/auth/RoleProtectedRoute";

export default function Page({ params }) {
  return (
    <RoleProtectedRoute allowedRoles={["admin", "parent"]}>
      <AdminExamStatisticsPage examId={params.id} />
    </RoleProtectedRoute>
  );
}
