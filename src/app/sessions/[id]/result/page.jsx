import FooterOne from "@/components/FooterOne";
import HeaderOne from "@/components/HeaderOne";
import RoleProtectedRoute from "@/components/auth/RoleProtectedRoute";
import SessionResultPage from "@/components/SessionResultPage";

export default function Page({ params }) {
  return (
    <RoleProtectedRoute allowedRoles={['child']}>
      <HeaderOne />
      <SessionResultPage sessionId={params.id} />
      <FooterOne />
    </RoleProtectedRoute>
  );
}
