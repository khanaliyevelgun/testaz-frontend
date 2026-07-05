import AdminQuestionFormPage from "@/components/admin/AdminQuestionFormPage";

export default function AdminQuestionEditRoute({ params }) {
  return <AdminQuestionFormPage questionId={params.id} />;
}
