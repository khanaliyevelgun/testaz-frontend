import AdminPlaceholderPage from "@/components/admin/AdminPlaceholderPage";

export default function Page() {
  return (
    <AdminPlaceholderPage
      title='Members'
      description='Organization members will be loaded from /api/v1/organizations/{orgId}/members.'
    />
  );
}
