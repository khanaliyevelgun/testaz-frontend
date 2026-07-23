"use client";

import Link from "next/link";

/**
 * Empty-state row for admin list tables.
 *
 * Replaces the bare gray "No X found." colspan cell with a centered block:
 * a muted Phosphor icon, the existing message (passed as children so its
 * translation key is preserved verbatim), and an optional action link — used
 * ONLY where a matching create action already exists on the page.
 *
 * Renders as a single <tr><td colSpan>; drop it in place of the old empty row.
 */
const AdminEmptyState = ({ columns = 4, icon = "ph ph-tray", children, action }) => (
  <tr>
    <td colSpan={columns} className='py-40 px-20'>
      <div className='d-flex flex-column align-items-center text-center gap-8'>
        <span className='w-56 h-56 rounded-circle bg-neutral-30 text-neutral-400 flex-center text-2xl'>
          <i className={icon} aria-hidden='true'></i>
        </span>
        <p className='text-14 text-neutral-400 mb-0'>{children}</p>
        {action ? (
          <Link href={action.href} className='btn btn-main rounded-pill px-20 mt-4'>
            {action.label}
          </Link>
        ) : null}
      </div>
    </td>
  </tr>
);

export default AdminEmptyState;
