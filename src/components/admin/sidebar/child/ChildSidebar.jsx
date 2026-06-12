import RoleSidebar from "@/components/admin/sidebar/RoleSidebar";
import { childSidebarItems } from "@/components/admin/sidebar/sidebarItems";

const ChildSidebar = (props) => (
  <RoleSidebar {...props} items={childSidebarItems} roleLabel='Child' />
);

export default ChildSidebar;
