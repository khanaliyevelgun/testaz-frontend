"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const AdminRowActions = ({ items }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    // Esc closes the menu and returns focus to the trigger (keyboard operability).
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className='dropdown position-relative' ref={dropdownRef}>
      <button
        ref={triggerRef}
        type='button'
        className='w-36 h-36 rounded-circle border border-neutral-30 text-neutral-500 flex-center bg-white'
        aria-label='Sətir əməliyyatları'
        aria-haspopup='menu'
        aria-expanded={isOpen}
        onClick={() => setIsOpen((value) => !value)}
      >
        <i className='ph-bold ph-dots-three-vertical' aria-hidden='true'></i>
      </button>
      {isOpen ? (
        <ul
          className='dropdown-menu rounded-12 show p-8 shadow-md border border-neutral-30'
          style={{ insetInlineEnd: 0, insetInlineStart: "auto", minWidth: 170 }}
          role='menu'
        >
          {items.map((item) => (
            <li key={item.label} role='none'>
              {item.href ? (
                <Link
                  href={item.href}
                  className='dropdown-item d-flex align-items-center gap-10 rounded-8'
                  role='menuitem'
                  onClick={() => setIsOpen(false)}
                >
                  <i className={item.icon} aria-hidden='true'></i>
                  {item.label}
                </Link>
              ) : (
                <button
                  type='button'
                  className={`dropdown-item d-flex align-items-center gap-10 rounded-8 ${
                    item.danger ? "text-danger" : ""
                  }`}
                  role='menuitem'
                  onClick={() => {
                    setIsOpen(false);
                    item.onClick?.();
                  }}
                >
                  <i className={item.icon} aria-hidden='true'></i>
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
