"use client";

import { useEffect, useState } from "react";
import AdminRefreshButton from "@/components/admin/AdminRefreshButton";
import AdminStatusBadge from "@/components/admin/AdminStatusBadge";
import { fetchAdminAuditLogs } from "@/lib/api";

const outcomes = ["SUCCESS", "FAILURE"];

const AdminAuditPage = () => {
  const [logs, setLogs] = useState([]);
  const [meta, setMeta] = useState({ page: 1, perPage: 10, total: 0, totalPages: 1 });
  const [filters, setFilters] = useState({ actorUserId: "", action: "", targetType: "", outcome: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadLogs = async (page = 1) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetchAdminAuditLogs({ page, perPage: 10, ...filters });
      setLogs(response.data || []);
      setMeta(response.meta || { page, perPage: 10, total: 0, totalPages: 1 });
    } catch {
      setError("Audit logs could not be loaded.");
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs(1);
  }, [filters]);

  const setFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }));

  return (
    <div className='px-24 py-24'>
      <div className='bg-white rounded-10 px-24 py-24'>
        <div className='d-flex flex-wrap align-items-center justify-content-between gap-16 mb-24'>
          <div>
            <h4 className='fw-semibold text-neutral-500 text-20 mb-4'>Audit Log</h4>
            <p className='text-14 text-neutral-400 mb-0'>Admin activity history and outcomes.</p>
          </div>
          <AdminRefreshButton isLoading={isLoading} onClick={() => loadLogs(meta.page)} />
        </div>

        <div className='d-flex flex-wrap align-items-center gap-12 mb-24'>
          <input className='common-input rounded-pill flex-grow-1 min-w-240-px' placeholder='Actor user ID' value={filters.actorUserId} onChange={(event) => setFilter("actorUserId", event.target.value)} />
          <input className='common-input rounded-pill min-w-180-px' placeholder='Action prefix' value={filters.action} onChange={(event) => setFilter("action", event.target.value)} />
          <input className='common-input rounded-pill min-w-180-px' placeholder='Target type' value={filters.targetType} onChange={(event) => setFilter("targetType", event.target.value)} />
          <select className='form-select rounded-pill border-neutral-40 text-14 py-11 px-16 w-auto min-w-160-px' value={filters.outcome} onChange={(event) => setFilter("outcome", event.target.value)}>
            <option value=''>Outcome</option>
            {outcomes.map((item) => <option value={item} key={item}>{item}</option>)}
          </select>
        </div>

        {error ? <p className='text-danger mb-16'>{error}</p> : null}

        <div className='table-responsive admin-users-table'>
          <table className='table mb-0'>
            <thead>
              <tr>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Action</th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Actor</th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Target</th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Outcome</th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>IP</th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Created</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td className='py-20 px-20 text-neutral-400' colSpan='6'>Loading...</td></tr>
              ) : logs.length ? (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{log.action || "-"}</td>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{log.actorUserId || "-"}</td>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{log.targetType || "-"} {log.targetId || ""}</td>
                    <td className='py-16 px-20'><AdminStatusBadge status={log.outcome} /></td>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{log.ip || "-"}</td>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{log.createdAt ? new Date(log.createdAt).toLocaleString("az-AZ") : "-"}</td>
                  </tr>
                ))
              ) : (
                <tr><td className='py-20 px-20 text-neutral-400' colSpan='6'>No audit logs found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className='d-flex align-items-center justify-content-end gap-8 mt-24'>
          <button type='button' className='px-14 py-8 border border-neutral-40 rounded-8 text-14 text-neutral-500' disabled={meta.page <= 1} onClick={() => loadLogs(Math.max(meta.page - 1, 1))}>Previous</button>
          <span className='text-14 text-neutral-400'>{meta.page} / {meta.totalPages}</span>
          <button type='button' className='px-14 py-8 border border-neutral-40 rounded-8 text-14 text-neutral-500' disabled={meta.page >= meta.totalPages} onClick={() => loadLogs(Math.min(meta.page + 1, meta.totalPages))}>Next</button>
        </div>
      </div>
    </div>
  );
};

export default AdminAuditPage;
