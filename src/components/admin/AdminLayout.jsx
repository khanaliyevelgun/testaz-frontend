"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AdminFooter from "@/components/admin/AdminFooter";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/sidebar/admin/AdminSidebar";
import ChildSidebar from "@/components/admin/sidebar/child/ChildSidebar";
import OrganizationSidebar from "@/components/admin/sidebar/organization/OrganizationSidebar";
import ParentSidebar from "@/components/admin/sidebar/parent/ParentSidebar";
import RoleProtectedRoute from "@/components/auth/RoleProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { ADMIN_ROLES, getPrimaryRole } from "@/lib/authRoles";

const sidebarByRole = {
  admin: AdminSidebar,
  parent: ParentSidebar,
  child: ChildSidebar,
  organization: OrganizationSidebar,
};

const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { logout, user } = useAuth();
  const router = useRouter();
  const role = getPrimaryRole(user);
  const Sidebar = sidebarByRole[role] || AdminSidebar;
  const name = user?.name || user?.fullName || user?.email || "Admin";

  const handleLogout = async () => {
    await logout();
    router.replace("/sign-in");
  };

  return (
    <RoleProtectedRoute allowedRoles={ADMIN_ROLES}>
      <div className='d-flex bg-main-25 min-h-screen'>
        <Sidebar
          userName={name}
          onLogout={handleLogout}
          onNavigate={() => setSidebarOpen(false)}
          isOpen={sidebarOpen}
        />
        {sidebarOpen ? (
          <button
            type='button'
            className='dashboard-side-overlay active'
            aria-label='Close dashboard sidebar'
            onClick={() => setSidebarOpen(false)}
          ></button>
        ) : null}
        <div className='dashbord-body flex-grow-1 min-h-screen d-flex flex-column'>
          <AdminHeader
            user={user}
            onLogout={handleLogout}
            onToggleSidebar={() => setSidebarOpen(true)}
          />
          <main className='flex-grow-1'>{children}</main>
          <AdminFooter />
        </div>
      </div>
    </RoleProtectedRoute>
  );
};

export default AdminLayout;
