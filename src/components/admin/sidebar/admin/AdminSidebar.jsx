import RoleSidebar from "@/components/admin/sidebar/RoleSidebar";
import { adminSidebarItems } from "@/components/admin/sidebar/sidebarItems";

const AdminSidebar = (props) => (
  <RoleSidebar {...props} items={adminSidebarItems} roleLabel='Admin' />
);

export default AdminSidebar;
