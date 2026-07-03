import RoleSidebar from "@/components/admin/sidebar/RoleSidebar";
import { organizationSidebarItems } from "@/components/admin/sidebar/sidebarItems";

const OrganizationSidebar = (props) => (
  <RoleSidebar {...props} items={organizationSidebarItems} roleLabel='Organization' />
);

export default OrganizationSidebar;
