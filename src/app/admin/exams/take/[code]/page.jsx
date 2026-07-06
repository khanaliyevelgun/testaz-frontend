import ExamTakePage from "@/components/admin/ExamTakePage";
import RoleProtectedRoute from "@/components/auth/RoleProtectedRoute";

export default function Page({ params }) {
  return (
    <RoleProtectedRoute allowedRoles={["child"]}>
      <ExamTakePage code={params.code} sessionBasePath='/admin/exam-session' />
    </RoleProtectedRoute>
  );
}
