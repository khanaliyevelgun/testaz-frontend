import FooterOne from "@/components/FooterOne";
import HeaderOne from "@/components/HeaderOne";
import PaymentReturnInner from "@/components/PaymentReturnInner";
import Animation from "@/helper/Animation";
import { Suspense } from "react";

export const metadata = {
  title: "Ödəniş nəticəsi - EduAll",
  description: "Ödənişinizin nəticəsi.",
};

const page = () => {
  return (
    <>
      <Animation />
      <HeaderOne />
      <Suspense fallback={null}>
        <PaymentReturnInner />
      </Suspense>
      <FooterOne />
    </>
  );
};

export default page;
