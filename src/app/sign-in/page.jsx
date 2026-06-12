import Breadcrumb from "@/components/Breadcrumb";
import FooterOne from "@/components/FooterOne";
import HeaderOne from "@/components/HeaderOne";
import SignInInner from "@/components/SignInInner";
import PublicOnlyRoute from "@/components/auth/PublicOnlyRoute";
import Animation from "@/helper/Animation";
import { Suspense } from "react";

export const metadata = {
  title: "Daxil ol - EduAll",
  description:
    "EduAll is a comprehensive and modern NEXT JS template designed for online education platforms, learning management systems (LMS), tutors, educational institutions, and online courses. It’s the perfect solution for creating an engaging and interactive online learning experience for students, educators, and institutions. Whether you’re offering online courses, running a tutoring platform, or managing an educational website, EduAll provides the tools to help you succeed. This template is tailored to meet the needs of educators, administrators, and students, providing a seamless and engaging user experience.",
};

const page = () => {
  return (
    <>
      {/* Animation */}
      <Animation />

      {/* HeaderTwo */}
      <HeaderOne />

      {/* Breadcrumb */}
      <Breadcrumb title={"Daxil ol"} />

      {/* SignInInner */}
      <Suspense fallback={null}>
        <PublicOnlyRoute redirectDelayMs={900}>
          <SignInInner />
        </PublicOnlyRoute>
      </Suspense>

      {/* FooterOne */}
      <FooterOne />
    </>
  );
};

export default page;
