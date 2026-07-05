import AdminSubjectFormPage from "@/components/admin/AdminSubjectFormPage";

export default function AdminSubjectEditRoute({ params }) {
  return <AdminSubjectFormPage subjectId={params.id} />;
}
