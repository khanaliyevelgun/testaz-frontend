import { Suspense } from "react";
import ChildJoinPage from "@/components/admin/ChildJoinPage";
import RoleProtectedRoute from "@/components/auth/RoleProtectedRoute";

export default function Page() {
  return (
    <RoleProtectedRoute allowedRoles={["child"]}>
      <Suspense fallback={null}>
        <ChildJoinPage />
      </Suspense>
    </RoleProtectedRoute>
  );
}
