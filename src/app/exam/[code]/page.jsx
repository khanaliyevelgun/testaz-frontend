import ExamTakePage from "@/components/admin/ExamTakePage";
import FooterOne from "@/components/FooterOne";
import HeaderOne from "@/components/HeaderOne";

export default function Page({ params }) {
  return (
    <>
      <HeaderOne />
      <ExamTakePage code={params.code} />
      <FooterOne />
    </>
  );
}
