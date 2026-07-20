"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { fetchNotifications, markNotificationsRead } from "@/lib/api";
import StaticText from "@/components/StaticText";


const fallbackNotifications = {
  data: [],
  meta: { unreadCount: 0 },
};

const AdminNotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(fallbackNotifications);
  const dropdownRef = useRef(null);
  const unreadCount = notifications?.meta?.unreadCount || 0;
  const badgeText = unreadCount > 9 ? "9+" : String(unreadCount);

  const loadUnreadNotifications = () => {
    let isMounted = true;

    fetchNotifications({ page: 1, perPage: 10, unreadOnly: true })
      .then((response) => {
        if (isMounted) setNotifications(response || fallbackNotifications);
      })
      .catch(() => {
        if (isMounted) setNotifications(fallbackNotifications);
      });

    return () => {
      isMounted = false;
    };
  };

  useEffect(() => loadUnreadNotifications(), []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkVisibleRead = async () => {
    const ids = notifications.data.filter((item) => !item.isRead).map((item) => item.id);
    if (!ids.length) return;

    await markNotificationsRead(ids);
    setNotifications((currentState) => ({
      data: [],
      meta: {
        ...currentState.meta,
        unreadCount: Math.max((currentState.meta?.unreadCount || 0) - ids.length, 0),
      },
    }));
  };

  return (
    <div className='dropdown position-relative' ref={dropdownRef}>
      <button
        className='w-36 h-36 border-neutral-50 border rounded-pill hover-bg-main-600 hover-text-white transition-03 position-relative'
        type='button'
        aria-expanded={isOpen}
        aria-label='Notifications'
        onClick={() => setIsOpen((currentValue) => !currentValue)}
      >
        <i className='ph ph-bell-simple'></i>
        {unreadCount > 0 ? (
          <span className='position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger-600 text-white text-10 px-6 py-2'>
            {badgeText}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <ul
          className='dropdown-menu rounded-12 show p-0 overflow-hidden shadow-md border border-neutral-30'
          style={{ insetInlineEnd: 0, insetInlineStart: "auto", minWidth: 340 }}
        >
          <li className='px-16 py-12 border-bottom border-neutral-30 d-flex align-items-center justify-content-between gap-12'>
            <span className='fw-medium text-14 text-neutral-500'><StaticText text={"Notifications"} /></span>
            <button
              type='button'
              className='text-12 text-main-600 fw-medium bg-transparent text-end'
              disabled={!notifications.data.length}
              onClick={handleMarkVisibleRead}
            >
              <StaticText text={"Mark visible as read"} />
            </button>
          </li>
          {notifications.data.length ? (
            notifications.data.map((item) => (
              <li key={item.id}>
                <Link
                  className='dropdown-item d-flex align-items-start gap-12 px-16 py-12'
                  href={item.href || "/admin/notifications"}
                  onClick={() => setIsOpen(false)}
                >
                  <span className='w-32 h-32 rounded-circle bg-main-25 text-main-600 flex-center flex-shrink-0'>
                    <i className='ph ph-bell-ringing'></i>
                  </span>
                  <span>
                    <span className='d-block text-13 fw-medium text-neutral-500'>{item.title}</span>
                    <span className='d-block text-12 text-neutral-400 line-clamp-1'>{item.message}</span>
                  </span>
                  <span className='w-8 h-8 bg-danger-600 rounded-circle flex-shrink-0 mt-8'></span>
                </Link>
              </li>
            ))
          ) : (
            <li className='px-16 py-20 text-13 text-neutral-400'><StaticText text={"No new notifications."} /></li>
          )}
          <li className='border-top border-neutral-30'>
            <Link
              href='/admin/notifications'
              className='dropdown-item text-center text-main-600 fw-medium py-12'
              onClick={() => setIsOpen(false)}
            >
              <StaticText text={"View all"} />
            </Link>
          </li>
        </ul>
      ) : null}
    </div>
  );
};

export default AdminNotificationDropdown;
