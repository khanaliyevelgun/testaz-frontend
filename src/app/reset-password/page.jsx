import Breadcrumb from "@/components/Breadcrumb";
import FooterOne from "@/components/FooterOne";
import HeaderOne from "@/components/HeaderOne";
import ResetPasswordInner from "@/components/ResetPasswordInner";
import PublicOnlyRoute from "@/components/auth/PublicOnlyRoute";
import Animation from "@/helper/Animation";
import { Suspense } from "react";

export const metadata = {
  title: "Yeni şifrə - EduAll",
  description: "EduAll hesabınız üçün yeni şifrə təyin edin.",
};

const page = () => {
  return (
    <>
      <Animation />
      <HeaderOne />
      <Breadcrumb title={"Yeni şifrə"} />
      <Suspense fallback={null}>
        <PublicOnlyRoute>
          <ResetPasswordInner />
        </PublicOnlyRoute>
      </Suspense>
      <FooterOne />
    </>
  );
};

export default page;
