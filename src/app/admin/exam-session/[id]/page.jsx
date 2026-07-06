import ExamSessionPage from "@/components/admin/ExamSessionPage";
import RoleProtectedRoute from "@/components/auth/RoleProtectedRoute";

export default function Page({ params }) {
  return (
    <RoleProtectedRoute allowedRoles={["child"]}>
      <ExamSessionPage sessionId={params.id} />
    </RoleProtectedRoute>
  );
}
