"use client";

import StaticText from "@/components/StaticText";

/**
 * Shared pager footer for admin list pages.
 *
 * Renders the exact markup previously duplicated verbatim across every admin
 * list page — only the page-change handler differed. `meta` is the normalized
 * page meta from `lib/api` (`{ page, totalPages }`); `onPageChange(nextPage)`
 * receives the already-clamped target page.
 */
const AdminPagination = ({ meta, onPageChange }) => {
  const page = meta?.page ?? 1;
  const totalPages = meta?.totalPages ?? 1;

  return (
    <div className='d-flex align-items-center justify-content-end gap-8 mt-24'>
      <button
        type='button'
        className='px-14 py-8 border border-neutral-40 rounded-8 text-14 text-neutral-500'
        disabled={page <= 1}
        onClick={() => onPageChange(Math.max(page - 1, 1))}
      >
        <StaticText text={"Previous"} />
      </button>
      <span className='text-14 text-neutral-400'>{page} / {totalPages}</span>
      <button
        type='button'
        className='px-14 py-8 border border-neutral-40 rounded-8 text-14 text-neutral-500'
        disabled={page >= totalPages}
        onClick={() => onPageChange(Math.min(page + 1, totalPages))}
      >
        <StaticText text={"Next"} />
      </button>
    </div>
  );
};

export default AdminPagination;
