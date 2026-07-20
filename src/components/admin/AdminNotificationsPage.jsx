"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AdminRefreshButton from "@/components/admin/AdminRefreshButton";
import { fetchNotifications, markNotificationsRead } from "@/lib/api";
import StaticText from "@/components/StaticText";


const emptyState = (page = 1) => ({
  data: [],
  meta: { page, perPage: 10, total: 0, totalPages: 1, unreadCount: 0 },
});

const AdminNotificationsPage = () => {
  const [page, setPage] = useState(1);
  const [state, setState] = useState(emptyState());
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    fetchNotifications({ page, perPage: 10 })
      .then(async (response) => {
        if (!isMounted) return;

        const unreadVisibleIds = response.data
          .filter((notification) => !notification.isRead)
          .map((notification) => notification.id);

        setState(response);

        if (unreadVisibleIds.length) {
          await markNotificationsRead(unreadVisibleIds);

          if (isMounted) {
            setState((currentState) => ({
              ...currentState,
              data: currentState.data.map((notification) =>
                unreadVisibleIds.includes(notification.id)
                  ? { ...notification, isRead: true, readAt: new Date().toISOString() }
                  : notification
              ),
              meta: {
                ...currentState.meta,
                unreadCount: Math.max(
                  (currentState.meta?.unreadCount || 0) - unreadVisibleIds.length,
                  0
                ),
              },
            }));
          }
        }
      })
      .catch(() => {
        if (isMounted) setState(emptyState(page));
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [page, refreshKey]);

  const totalPages = state?.meta?.totalPages || 1;

  return (
    <div className='px-24 py-24'>
      <div className='bg-white rounded-10 px-24 py-24'>
        <div className='d-flex align-items-center justify-content-between gap-16 mb-24'>
          <div>
            <h4 className='fw-semibold text-neutral-500 text-20 mb-4'><StaticText text={"Notifications"} /></h4>
            <p className='text-14 text-neutral-400 mb-0'>
              <StaticText text={"Unread notifications:"} /> {state?.meta?.unreadCount || 0}
            </p>
          </div>
          <AdminRefreshButton isLoading={isLoading} onClick={() => setRefreshKey((value) => value + 1)} />
        </div>

        {isLoading ? (
          <p className='text-14 text-neutral-400 mb-0'><StaticText text={"Loading..."} /></p>
        ) : state.data.length ? (
          <div className='d-flex flex-column gap-12'>
            {state.data.map((notification) => (
              <Link
                href={notification.href || "/admin/notifications"}
                key={notification.id}
                className='border border-neutral-30 rounded-8 px-16 py-14 d-flex align-items-start gap-12 hover-bg-main-25 transition-03'
              >
                <span className='w-40 h-40 rounded-circle bg-main-25 text-main-600 flex-center flex-shrink-0'>
                  <i className='ph ph-bell-ringing'></i>
                </span>
                <span className='flex-grow-1'>
                  <span className='d-flex align-items-center gap-8 mb-4'>
                    <span className='text-15 text-neutral-500 fw-medium mb-0'>{notification.title}</span>
                    {!notification.isRead ? (
                      <span className='px-8 py-2 rounded-pill bg-danger-600 text-white text-10'>
                        <StaticText text={"New"} />
                      </span>
                    ) : null}
                  </span>
                  <span className='d-block text-14 text-neutral-400 mb-6'>{notification.message}</span>
                  <span className='text-12 text-neutral-300'>
                    {new Date(notification.createdAt).toLocaleString("az-AZ")}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p className='text-14 text-neutral-400 mb-0'><StaticText text={"No notifications."} /></p>
        )}

        <div className='d-flex align-items-center justify-content-end gap-8 mt-24'>
          <button
            type='button'
            className='px-14 py-8 border border-neutral-40 rounded-8 text-14 text-neutral-500'
            disabled={page <= 1}
            onClick={() => setPage((currentPage) => Math.max(currentPage - 1, 1))}
          >
            <StaticText text={"Previous"} />
          </button>
          <span className='text-14 text-neutral-400'>
            {page} / {totalPages}
          </span>
          <button
            type='button'
            className='px-14 py-8 border border-neutral-40 rounded-8 text-14 text-neutral-500'
            disabled={page >= totalPages}
            onClick={() => setPage((currentPage) => Math.min(currentPage + 1, totalPages))}
          >
            <StaticText text={"Next"} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminNotificationsPage;
