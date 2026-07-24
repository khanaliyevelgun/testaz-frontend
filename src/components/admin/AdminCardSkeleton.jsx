"use client";

import StaticText from "@/components/StaticText";

/**
 * Loading placeholder for single-record detail/form cards (the non-table counterpart of
 * {@link AdminTableSkeleton}). Renders `rows` shimmer field-rows — each a short label line above a
 * taller input line — so a form/detail card doesn't jump from a bare "Loading…" line to full content.
 *
 * The shimmer itself lives in globals.scss (`.skeleton`, prefers-reduced-motion aware). The visual
 * rows are aria-hidden (decorative); a single visually-hidden, polite status announces loading to AT.
 *
 * Props:
 *  - `rows`     number of field-row placeholders (default 4)
 *  - `columns`  how many rows sit side-by-side per grid row (1 = stacked, 2 = two-up; default 2)
 */
const AdminCardSkeleton = ({ rows = 4, columns = 2 }) => {
  const colClass = columns >= 2 ? "col-md-6" : "col-12";
  return (
    <div>
      <span className='visually-hidden' role='status' aria-live='polite'>
        <StaticText text={"Loading..."} />
      </span>
      <div className='row gy-4' aria-hidden='true'>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div className={colClass} key={rowIndex}>
            <span className='skeleton skeleton-text mb-8' style={{ maxWidth: "40%" }} />
            <span className='skeleton skeleton-input' />
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminCardSkeleton;
