import ExamSessionPage from "@/components/admin/ExamSessionPage";
import FooterOne from "@/components/FooterOne";
import HeaderOne from "@/components/HeaderOne";

export default function Page({ params }) {
  return (
    <>
      <HeaderOne />
      <ExamSessionPage sessionId={params.id} />
      <FooterOne />
    </>
  );
}
