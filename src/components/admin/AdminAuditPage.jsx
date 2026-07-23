"use client";

import { useEffect, useState } from "react";
import AdminRefreshButton from "@/components/admin/AdminRefreshButton";
import AdminStatusBadge from "@/components/admin/AdminStatusBadge";
import AdminPagination from "@/components/admin/AdminPagination";
import { fetchAdminAuditLogs } from "@/lib/api";
import StaticText from "@/components/StaticText";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import AdminTableSkeleton from "@/components/admin/AdminTableSkeleton";
import StaticOption from "@/components/StaticOption";



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
      setError("Audit qeydləri yüklənmədi.");
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
            <h4 className='fw-semibold text-neutral-500 text-20 mb-4'><StaticText text={"Audit Log"} /></h4>
            <p className='text-14 text-neutral-400 mb-0'><StaticText text={"Admin activity history and outcomes."} /></p>
          </div>
          <AdminRefreshButton isLoading={isLoading} onClick={() => loadLogs(meta.page)} />
        </div>

        <div className='d-flex flex-wrap align-items-center gap-12 mb-24'>
          <input className='common-input rounded-pill flex-grow-1 min-w-240-px' placeholder='İcraçı istifadəçi ID-si' value={filters.actorUserId} onChange={(event) => setFilter("actorUserId", event.target.value)} />
          <input className='common-input rounded-pill min-w-180-px' placeholder='Əməliyyat prefiksi' value={filters.action} onChange={(event) => setFilter("action", event.target.value)} />
          <input className='common-input rounded-pill min-w-180-px' placeholder='Hədəf növü' value={filters.targetType} onChange={(event) => setFilter("targetType", event.target.value)} />
          <select className='form-select rounded-pill border-neutral-40 text-14 py-11 px-16 w-auto min-w-160-px' value={filters.outcome} onChange={(event) => setFilter("outcome", event.target.value)}>
            <StaticOption value='' text={"Outcome"} />
            {outcomes.map((item) => <option value={item} key={item}>{item}</option>)}
          </select>
        </div>

        {error ? <p className='text-danger mb-16'>{error}</p> : null}

        <div className='table-responsive admin-users-table'>
          <table className='table mb-0'>
            <thead>
              <tr>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'><StaticText text={"Action"} /></th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'><StaticText text={"Actor"} /></th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'><StaticText text={"Target"} /></th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'><StaticText text={"Outcome"} /></th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'><StaticText text={"IP"} /></th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'><StaticText text={"Created"} /></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <AdminTableSkeleton columns={6} />
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
                <AdminEmptyState columns={6} icon='ph ph-clipboard-text'><StaticText text={"No audit logs found."} /></AdminEmptyState>
              )}
            </tbody>
          </table>
        </div>

        <AdminPagination meta={meta} onPageChange={loadLogs} />
      </div>
    </div>
  );
};

export default AdminAuditPage;
