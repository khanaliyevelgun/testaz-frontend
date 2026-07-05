import AdminUserFormPage from "@/components/admin/AdminUserFormPage";

export default function Page({ params }) {
  return <AdminUserFormPage userId={params.id} />;
}
