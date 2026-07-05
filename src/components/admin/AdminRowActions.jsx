"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const AdminRowActions = ({ items }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

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
        type='button'
        className='w-36 h-36 rounded-circle border border-neutral-30 text-neutral-500 flex-center bg-white'
        aria-label='Sətir əməliyyatları'
        aria-expanded={isOpen}
        onClick={() => setIsOpen((value) => !value)}
      >
        <i className='ph-bold ph-dots-three-vertical'></i>
      </button>
      {isOpen ? (
        <ul
          className='dropdown-menu rounded-12 show p-8 shadow-md border border-neutral-30'
          style={{ insetInlineEnd: 0, insetInlineStart: "auto", minWidth: 170 }}
        >
          {items.map((item) => (
            <li key={item.label}>
              {item.href ? (
                <Link
                  href={item.href}
                  className='dropdown-item d-flex align-items-center gap-10 rounded-8'
                  onClick={() => setIsOpen(false)}
                >
                  <i className={item.icon}></i>
                  {item.label}
                </Link>
              ) : (
                <button
                  type='button'
                  className={`dropdown-item d-flex align-items-center gap-10 rounded-8 ${
                    item.danger ? "text-danger" : ""
                  }`}
                  onClick={() => {
                    setIsOpen(false);
                    item.onClick?.();
                  }}
                >
                  <i className={item.icon}></i>
                  {item.label}
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
};

export default AdminRowActions;
