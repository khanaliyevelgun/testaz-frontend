import AboutOne from "@/components/AboutOne";
import BrandTwo from "@/components/BrandTwo";
import Breadcrumb from "@/components/Breadcrumb";
import CertificateOne from "@/components/CertificateOne";
import ChooseUsOne from "@/components/ChooseUsOne";
import CounterOne from "@/components/CounterOne";
import FooterOne from "@/components/FooterOne";
import HeaderOne from "@/components/HeaderOne";
import InstructorOne from "@/components/InstructorOne";
import TestimonialsOne from "@/components/TestimonialsOne";
import Animation from "@/helper/Animation";

export const metadata = {
  title: "EduSınaq | Haqqımızda",
  description: "EduSınaq onlayn təhsil, imtahan və öyrənmə idarəetməsi platformasıdır.",
};

const page = () => (
  <>
    <Animation />
    <HeaderOne />
    <Breadcrumb title="Haqqımızda" />
    <AboutOne />
    <InstructorOne />
    <ChooseUsOne />
    <CounterOne />
    <TestimonialsOne />
    <BrandTwo />
    <CertificateOne />
    <FooterOne />
  </>
);

export default page;
