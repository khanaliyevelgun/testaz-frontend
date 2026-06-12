"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const RoleSidebar = ({
  items,
  userName = "İstifadəçi",
  roleLabel = "Admin",
  onLogout,
  onNavigate,
  isOpen = false,
}) => {
  const pathname = usePathname();

  return (
    <div
      className={`dashboard-sidebar px-20 py-24 max-w-288-px bg-white w-100 border-end border-neutral-40 position-relative ${
        isOpen ? "active" : ""
      }`}
    >
      <Link href='/admin'>
        <img src='/assets/images/logo/logo.png' alt='EduAll' />
      </Link>
      <span className='w-100 bg-neutral-40 mb-24 mt-24 h-1 d-inline-block'></span>
      <div className='overflow-x-auto'>
        <div className='scrollbar min-w-max'>
          <span className='text-neutral-500 fw-normal text-14 mb-8 d-inline-block'>
            Xoş gəlmisiniz, {userName}
          </span>
          <ul>
            {items.map((item) => {
              const active = pathname === item.href;
              return (
                <li className={`mb-8 ${active ? "activePage" : ""}`} key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    className='fw-medium d-flex align-items-center text-14 gap-8 text-neutral-500 hover-bg-main-600 px-24 py-10 hover-text-white rounded-12 item-hover flex-wrap'
                  >
                    <span className='text-16 text-main-600 item-hover__text transition-03'>
                      <i className={item.icon}></i>
                    </span>
                    {item.label}
                  </Link>
                </li>
              );
            })}
            <li className='mb-8'>
              <span className='fw-normal text-14 text-neutral-500'>{roleLabel}</span>
            </li>
          </ul>
        </div>
      </div>

      <div className='position-absolute inset-block-end-0 inset-inline-start-0 pb-16 px-16 w-100'>
        <button
          type='button'
          onClick={onLogout}
          className='text-14 fw-medium text-neutral-500 d-flex align-items-center gap-8 hover-bg-main-600 px-24 py-10 hover-text-white rounded-12 item-hover flex-wrap bg-white w-100'
        >
          <span className='text-16 text-main-600 item-hover__text transition-03'>
            <i className='ph ph-sign-out'></i>
          </span>
          Çıxış
        </button>
      </div>
    </div>
  );
};

export default RoleSidebar;
