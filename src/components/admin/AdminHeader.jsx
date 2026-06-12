const AdminHeader = ({ onToggleSidebar, user }) => {
  const name = user?.name || user?.fullName || user?.email || "Admin";

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
          <div className='max-w-357-px position-relative d-sm-block d-none'>
            <form>
              <input
                type='text'
                placeholder='Axtar'
                className='ps-16 pe-36 py-9 border border-neutral-40 rounded-pill focus-visible-outline focus-border-main-600 text-14 line-height-1'
              />
              <button
                type='button'
                className='w-28 h-28 bg-main-600 text-white text-16 rounded-circle justify-content-center align-items-center d-flex position-absolute top-50-percent translate-middle-y inset-inline-end-0-px me-4'
              >
                <i className='ph-bold ph-magnifying-glass'></i>
              </button>
            </form>
          </div>
        </div>

        <div className='d-flex align-items-center gap-16'>
          <button
            type='button'
            className='px-20 py-10 border-main-600 border rounded-pill text-14 text-main-600 hover-bg-main-600 hover-text-white hover-border-600 d-lg-block d-none line-height-1'
          >
            Yeni kurs yarat
          </button>
          <button
            type='button'
            className='w-36 h-36 border-neutral-50 border rounded-pill justify-content-center align-items-center d-flex text-20 text-neutral-500 hover-bg-main-600 transition-03 hover-text-white'
          >
            <i className='ph ph-bell'></i>
          </button>
          <div className='d-flex align-items-center gap-8'>
            <span className='w-36 h-36 rounded-circle bg-main-25 flex-center text-main-600'>
              <i className='ph ph-user'></i>
            </span>
            <div className='d-sm-block d-none'>
              <span className='text-14 fw-medium text-neutral-500 d-block'>{name}</span>
              <span className='text-12 text-neutral-400'>Dashboard</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminHeader;
