"use client";

import StaticText from "@/components/StaticText";

/**
 * Shared pager footer for admin list pages.
 *
 * Renders the exact markup previously duplicated verbatim across every admin
 * list page — only the page-change handler differed. `meta` is the normalized
 * page meta from `lib/api` (`{ page, totalPages }`); `onPageChange(nextPage)`
 * receives the already-clamped target page.
 *
 * Accessibility: wrapped in a labelled <nav>; the page counter is an
 * aria-live region so screen readers announce page changes; disabled buttons
 * get a visible dimmed state (there is no opacity utility in the template, so
 * it is applied inline, scoped to this component — no global style added).
 */
const disabledStyle = { opacity: 0.5, cursor: "not-allowed" };

const AdminPagination = ({ meta, onPageChange }) => {
  const page = meta?.page ?? 1;
  const totalPages = meta?.totalPages ?? 1;
  const atStart = page <= 1;
  const atEnd = page >= totalPages;

  return (
    <nav className='admin-pager d-flex align-items-center justify-content-end gap-8 mt-24' aria-label='Səhifələmə'>
      <button
        type='button'
        className='px-14 py-8 border border-neutral-40 rounded-8 text-14 text-neutral-500'
        style={atStart ? disabledStyle : undefined}
        disabled={atStart}
        onClick={() => onPageChange(Math.max(page - 1, 1))}
      >
        <StaticText text={"Previous"} />
      </button>
      <span className='text-14 text-neutral-400' aria-live='polite'>
        {page} / {totalPages}
      </span>
      <button
        type='button'
        className='px-14 py-8 border border-neutral-40 rounded-8 text-14 text-neutral-500'
        style={atEnd ? disabledStyle : undefined}
        disabled={atEnd}
        onClick={() => onPageChange(Math.min(page + 1, totalPages))}
      >
        <StaticText text={"Next"} />
      </button>
    </nav>
  );
};

export default AdminPagination;
