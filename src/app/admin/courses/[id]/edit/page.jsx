import AdminPlaceholderPage from "@/components/admin/AdminPlaceholderPage";

export default function Page({ params }) {
  return (
    <AdminPlaceholderPage
      title='Fənni redaktə et'
      description={`Fənn redaktə formu burada hazırlanacaq. ID: ${params.id}`}
    />
  );
}
