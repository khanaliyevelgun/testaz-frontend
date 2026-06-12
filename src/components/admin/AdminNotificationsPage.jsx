"use client";

import { useEffect, useState } from "react";
import { fetchNotifications } from "@/lib/api";

const AdminNotificationsPage = () => {
  const [page, setPage] = useState(1);
  const [state, setState] = useState({
    data: [],
    meta: { page: 1, perPage: 10, total: 0, totalPages: 1, unreadCount: 0 },
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    fetchNotifications({ page, perPage: 10 })
      .then((response) => {
        if (isMounted) setState(response);
      })
      .catch(() => {
        if (isMounted) {
          setState({
            data: [],
            meta: { page, perPage: 10, total: 0, totalPages: 1, unreadCount: 0 },
          });
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [page]);

  const totalPages = state?.meta?.totalPages || 1;

  return (
    <div className='px-24 py-24'>
      <div className='bg-white rounded-10 px-24 py-24'>
        <div className='d-flex align-items-center justify-content-between gap-16 mb-24'>
          <div>
            <h4 className='fw-semibold text-neutral-500 text-20 mb-4'>Bildirişlər</h4>
            <p className='text-14 text-neutral-400 mb-0'>
              Oxunmamış bildirişlər: {state?.meta?.unreadCount || 0}
            </p>
          </div>
        </div>

        {isLoading ? (
          <p className='text-14 text-neutral-400 mb-0'>Yüklənir...</p>
        ) : state.data.length ? (
          <div className='d-flex flex-column gap-12'>
            {state.data.map((notification) => (
              <div
                key={notification.id}
                className='border border-neutral-30 rounded-8 px-16 py-14 d-flex align-items-start gap-12'
              >
                <span className='w-40 h-40 rounded-circle bg-main-25 text-main-600 flex-center flex-shrink-0'>
                  <i className='ph ph-bell-ringing'></i>
                </span>
                <div className='flex-grow-1'>
                  <div className='d-flex align-items-center gap-8 mb-4'>
                    <h6 className='text-15 text-neutral-500 fw-medium mb-0'>{notification.title}</h6>
                    {!notification.isRead ? (
                      <span className='px-8 py-2 rounded-pill bg-danger-600 text-white text-10'>
                        Yeni
                      </span>
                    ) : null}
                  </div>
                  <p className='text-14 text-neutral-400 mb-6'>{notification.message}</p>
                  <span className='text-12 text-neutral-300'>
                    {new Date(notification.createdAt).toLocaleString("az-AZ")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className='text-14 text-neutral-400 mb-0'>Bildiriş yoxdur.</p>
        )}

        <div className='d-flex align-items-center justify-content-end gap-8 mt-24'>
          <button
            type='button'
            className='px-14 py-8 border border-neutral-40 rounded-8 text-14 text-neutral-500'
            disabled={page <= 1}
            onClick={() => setPage((currentPage) => Math.max(currentPage - 1, 1))}
          >
            Əvvəlki
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
            Növbəti
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminNotificationsPage;
