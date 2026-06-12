import AdminTopicsPage from "@/components/admin/AdminTopicsPage";

export default function Page({ params }) {
  return <AdminTopicsPage subjectId={params.id} />;
}
