import Breadcrumb from "@/components/Breadcrumb";
import FooterOne from "@/components/FooterOne";
import ForgotPasswordInner from "@/components/ForgotPasswordInner";
import HeaderOne from "@/components/HeaderOne";
import PublicOnlyRoute from "@/components/auth/PublicOnlyRoute";
import Animation from "@/helper/Animation";
import { Suspense } from "react";

export const metadata = {
  title: "Forgot Password - EduAll",
  description: "Request a password reset link for your EduAll account.",
};

const page = () => {
  return (
    <>
      <Animation />
      <HeaderOne />
      <Breadcrumb title={"Forgot Password"} />
      <Suspense fallback={null}>
        <PublicOnlyRoute>
          <ForgotPasswordInner />
        </PublicOnlyRoute>
      </Suspense>
      <FooterOne />
    </>
  );
};

export default page;
