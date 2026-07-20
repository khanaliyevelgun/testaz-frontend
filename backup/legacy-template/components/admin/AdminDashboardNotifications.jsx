"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchNotifications } from "@/lib/api";

const emptyNotifications = {
  data: [],
  meta: { unreadCount: 0 },
};

const AdminDashboardNotifications = () => {
  const [notifications, setNotifications] = useState(emptyNotifications);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    fetchNotifications({ page: 1, perPage: 5 })
      .then((response) => {
        if (isMounted) setNotifications(response || emptyNotifications);
      })
      .catch(() => {
        if (isMounted) setNotifications(emptyNotifications);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className='px-24 py-24 bg-white rounded-10 h-100'>
      <div className='d-flex align-items-center justify-content-between mb-24'>
        <div>
          <h6 className='mb-4 fw-medium text-16 text-neutral-500'>Notifications</h6>
          <span className='text-12 text-neutral-400'>
            Unread: {notifications.meta?.unreadCount || 0}
          </span>
        </div>
        <Link href='/admin/notifications' className='text-12 fw-medium text-main-600 hover-underline transition-03'>
          View all
        </Link>
      </div>

      {isLoading ? (
        <p className='text-14 text-neutral-400 mb-0'>Loading...</p>
      ) : notifications.data.length ? (
        <div className='d-flex flex-column gap-12'>
          {notifications.data.map((notification) => (
            <Link
              href={notification.href || "/admin/notifications"}
              key={notification.id}
              className='d-flex align-items-start gap-12 border border-neutral-30 rounded-8 px-14 py-12 hover-bg-main-25 transition-03'
            >
              <span className='w-36 h-36 rounded-circle bg-main-25 text-main-600 flex-center flex-shrink-0'>
                <i className='ph ph-bell-ringing'></i>
              </span>
              <span className='flex-grow-1'>
                <span className='d-flex align-items-center gap-8 mb-4'>
                  <span className='text-14 fw-medium text-neutral-500 line-clamp-1'>
                    {notification.title}
                  </span>
                  {!notification.isRead ? (
                    <span className='w-8 h-8 bg-danger-600 rounded-circle flex-shrink-0'></span>
                  ) : null}
                </span>
                <span className='d-block text-12 text-neutral-400 line-clamp-2'>
                  {notification.message}
                </span>
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <p className='text-14 text-neutral-400 mb-0'>No notifications.</p>
      )}
    </div>
  );
};

export default AdminDashboardNotifications;
