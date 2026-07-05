import AdminTopicFormPage from "@/components/admin/AdminTopicFormPage";

export default function Page({ params }) {
  return <AdminTopicFormPage subjectId={params.id} />;
}
