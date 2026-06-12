import AdminPlaceholderPage from "@/components/admin/AdminPlaceholderPage";

export default function Page({ params }) {
  return (
    <AdminPlaceholderPage
      title='İstifadəçini redaktə et'
      description={`İstifadəçi redaktə formu burada hazırlanacaq. ID: ${params.id}`}
    />
  );
}
