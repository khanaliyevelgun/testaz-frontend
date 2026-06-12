"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const AdminProfileDropdown = ({ user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const name = user?.name || user?.fullName || user?.email || "Admin";

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className='dropdown position-relative' ref={dropdownRef}>
      <button
        className='w-36 h-36 border-neutral-50 border rounded-pill bg-main-25 text-main-600 flex-center'
        type='button'
        aria-expanded={isOpen}
        aria-label='Profil menyusu'
        onClick={() => setIsOpen((currentValue) => !currentValue)}
      >
        <i className='ph ph-user'></i>
      </button>

      {isOpen ? (
        <ul
          className='dropdown-menu rounded-12 show p-8 shadow-md border border-neutral-30'
          style={{ insetInlineEnd: 0, insetInlineStart: "auto", minWidth: 220 }}
        >
          <li className='px-12 py-8 border-bottom border-neutral-30 mb-4'>
            <span className='d-block text-14 fw-medium text-neutral-500'>{name}</span>
            {user?.email ? <span className='d-block text-12 text-neutral-400'>{user.email}</span> : null}
          </li>
          <li>
            <Link
              className='dropdown-item d-flex align-items-center gap-12 hover-text-main-600 transition-03 rounded-8'
              href='/admin/profile'
              onClick={() => setIsOpen(false)}
            >
              <span><i className='ph ph-user-circle'></i></span>
              <span>Profil</span>
            </Link>
          </li>
          <li>
            <Link
              className='dropdown-item d-flex align-items-center gap-12 hover-text-main-600 transition-03 rounded-8'
              href='/admin/settings'
              onClick={() => setIsOpen(false)}
            >
              <span><i className='ph ph-gear'></i></span>
              <span>Ayarlar</span>
            </Link>
          </li>
          <li>
            <button
              type='button'
              className='dropdown-item d-flex align-items-center gap-12 hover-text-main-600 transition-03 rounded-8'
              onClick={onLogout}
            >
              <span><i className='ph ph-power'></i></span>
              <span>Çıxış</span>
            </button>
          </li>
        </ul>
      ) : null}
    </div>
  );
};

export default AdminProfileDropdown;
