import AdminPlaceholderPage from "@/components/admin/AdminPlaceholderPage";

export default function Page({ params }) {
  return (
    <AdminPlaceholderPage
      title='Mövzunu redaktə et'
      description={`Mövzu redaktə formu burada hazırlanacaq. ID: ${params.topicId}`}
    />
  );
}
