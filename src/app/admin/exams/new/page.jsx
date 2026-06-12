import AdminPlaceholderPage from "@/components/admin/AdminPlaceholderPage";
import RoleProtectedRoute from "@/components/auth/RoleProtectedRoute";

export default function Page() {
  return (
    <RoleProtectedRoute allowedRoles={["admin", "parent"]}>
      <AdminPlaceholderPage
        title='Yeni imtahan yarat'
        description='Admin və parent rolları üçün imtahan yaratma formu burada hazırlanacaq.'
      />
    </RoleProtectedRoute>
  );
}
