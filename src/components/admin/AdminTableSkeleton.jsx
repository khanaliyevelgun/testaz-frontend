"use client";

import StaticText from "@/components/StaticText";

/**
 * Loading placeholder for admin list tables.
 *
 * Replaces the single "loading" text row with `rows` shimmer rows that mirror the
 * table's `columns` count, so the layout doesn't jump when data arrives. The shimmer
 * itself lives in globals.scss (`.skeleton`, prefers-reduced-motion aware).
 *
 * The visual rows are aria-hidden (decorative); a single visually-hidden, polite
 * status row announces the loading state to assistive tech.
 */
const AdminTableSkeleton = ({ columns = 4, rows = 5 }) => (
  <>
    <tr>
      <td colSpan={columns} className='p-0 border-0'>
        <span className='visually-hidden' role='status' aria-live='polite'>
          <StaticText text={"Loading..."} />
        </span>
      </td>
    </tr>
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <tr key={rowIndex} aria-hidden='true'>
        {Array.from({ length: columns }).map((__, colIndex) => (
          <td key={colIndex} className='py-16 px-20'>
            <span
              className='skeleton skeleton-text'
              style={{ maxWidth: colIndex === 0 ? "70%" : colIndex === columns - 1 ? "40%" : "85%" }}
            />
          </td>
        ))}
      </tr>
    ))}
  </>
);

export default AdminTableSkeleton;
