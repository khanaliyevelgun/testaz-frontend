import RoleSidebar from "@/components/admin/sidebar/RoleSidebar";
import { parentSidebarItems } from "@/components/admin/sidebar/sidebarItems";

const ParentSidebar = (props) => (
  <RoleSidebar {...props} items={parentSidebarItems} roleLabel='Parent' />
);

export default ParentSidebar;
