"use client";

import { useEffect, useState } from "react";
import AdminRefreshButton from "@/components/admin/AdminRefreshButton";
import AdminRowActions from "@/components/admin/AdminRowActions";
import AdminStatusBadge from "@/components/admin/AdminStatusBadge";
import { dismissAdminReport, fetchAdminReports, resolveAdminReport } from "@/lib/api";

const statuses = ["OPEN", "RESOLVED", "DISMISSED"];

const AdminReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [meta, setMeta] = useState({ page: 1, perPage: 10, total: 0, totalPages: 1 });
  const [status, setStatus] = useState("OPEN");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReports = async ({ page = 1, nextStatus = status } = {}) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetchAdminReports({ page, perPage: 10, status: nextStatus });
      setReports(response.data || []);
      setMeta(response.meta || { page, perPage: 10, total: 0, totalPages: 1 });
    } catch {
      setError("Reports could not be loaded.");
      setReports([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports({ page: 1 });
  }, [status]);

  const updateReport = async (report, type) => {
    const note = window.prompt("Resolution note", "");
    if (note === null) return;

    try {
      if (type === "resolve") {
        await resolveAdminReport(report.id, { note, archiveQuestion: false });
      } else {
        await dismissAdminReport(report.id, { note });
      }
      await loadReports({ page: meta.page });
    } catch {
      setError("Report action failed.");
    }
  };

  const actionsFor = (report) => [
    { label: "Resolve", icon: "ph ph-check", onClick: () => updateReport(report, "resolve") },
    { label: "Dismiss", icon: "ph ph-x", danger: true, onClick: () => updateReport(report, "dismiss") },
  ];

  return (
    <div className='px-24 py-24'>
      <div className='bg-white rounded-10 px-24 py-24'>
        <div className='d-flex flex-wrap align-items-center justify-content-between gap-16 mb-24'>
          <div>
            <h4 className='fw-semibold text-neutral-500 text-20 mb-4'>Reports</h4>
            <p className='text-14 text-neutral-400 mb-0'>Question report queue and moderation actions.</p>
          </div>
          <AdminRefreshButton isLoading={isLoading} onClick={() => loadReports({ page: meta.page })} />
        </div>

        <div className='d-flex flex-wrap align-items-center gap-12 mb-24'>
          <select
            className='form-select rounded-pill border-neutral-40 text-14 py-11 px-16 w-auto min-w-180-px'
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value=''>All statuses</option>
            {statuses.map((item) => (
              <option value={item} key={item}>{item}</option>
            ))}
          </select>
        </div>

        {error ? <p className='text-danger mb-16'>{error}</p> : null}

        <div className='table-responsive admin-users-table'>
          <table className='table mb-0'>
            <thead>
              <tr>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Reason</th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Comment</th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Question</th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Status</th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20 text-end'>Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td className='py-20 px-20 text-neutral-400' colSpan='5'>Loading...</td></tr>
              ) : reports.length ? (
                reports.map((report) => (
                  <tr key={report.id}>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{report.reason || "-"}</td>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{report.comment || "-"}</td>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{report.questionId || "-"}</td>
                    <td className='py-16 px-20'><AdminStatusBadge status={report.status} /></td>
                    <td className='py-16 px-20'><div className='d-flex justify-content-end'><AdminRowActions items={actionsFor(report)} /></div></td>
                  </tr>
                ))
              ) : (
                <tr><td className='py-20 px-20 text-neutral-400' colSpan='5'>No reports found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className='d-flex align-items-center justify-content-end gap-8 mt-24'>
          <button type='button' className='px-14 py-8 border border-neutral-40 rounded-8 text-14 text-neutral-500' disabled={meta.page <= 1} onClick={() => loadReports({ page: Math.max(meta.page - 1, 1) })}>Previous</button>
          <span className='text-14 text-neutral-400'>{meta.page} / {meta.totalPages}</span>
          <button type='button' className='px-14 py-8 border border-neutral-40 rounded-8 text-14 text-neutral-500' disabled={meta.page >= meta.totalPages} onClick={() => loadReports({ page: Math.min(meta.page + 1, meta.totalPages) })}>Next</button>
        </div>
      </div>
    </div>
  );
};

export default AdminReportsPage;
