import Link from "next/link";
import AdminNotificationDropdown from "@/components/admin/AdminNotificationDropdown";
import AdminProfileDropdown from "@/components/admin/AdminProfileDropdown";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { getPrimaryRole } from "@/lib/authRoles";

const AdminHeader = ({ onToggleSidebar, onLogout, user }) => {
  const role = getPrimaryRole(user);
  const canCreateExam = role === "admin" || role === "parent";

  return (
    <div className='px-24 py-16 bg-neutral-10 border-bottom border-neutral-40 w-100'>
      <div className='d-flex align-items-center justify-content-between gap-24 w-100'>
        <div className='d-flex align-items-center gap-24'>
          <button
            type='button'
            className='toggle-dashbord-button text-neutral-500 text-28 line-height-1 d-lg-none d-block'
            onClick={onToggleSidebar}
          >
            <i className='ph-bold ph-list'></i>
          </button>
          <h5 className='mb-0 text-neutral-500 fw-semibold text-18'>İdarə paneli</h5>
        </div>

        <div className='d-flex align-items-center gap-16'>
          {canCreateExam ? (
            <Link
              href='/admin/exams/new'
              className='px-20 py-10 border-main-600 border rounded-pill text-14 text-main-600 hover-bg-main-600 hover-text-white hover-border-600 d-lg-block d-none line-height-1'
            >
              Yeni imtahan yarat
            </Link>
          ) : null}
          <LanguageSwitcher className='w-auto min-w-70-px' />
          <AdminNotificationDropdown />
          <AdminProfileDropdown user={user} onLogout={onLogout} />
        </div>
      </div>
    </div>
  );
};

export default AdminHeader;
