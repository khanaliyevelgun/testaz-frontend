"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AdminRefreshButton from "@/components/admin/AdminRefreshButton";
import AdminRowActions from "@/components/admin/AdminRowActions";
import AdminStatusBadge from "@/components/admin/AdminStatusBadge";
import AdminPagination from "@/components/admin/AdminPagination";
import { deleteUser, fetchUsers, restoreUser } from "@/lib/api";
import StaticText from "@/components/StaticText";
import AdminTableSkeleton from "@/components/admin/AdminTableSkeleton";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import StaticOption from "@/components/StaticOption";



const roles = ["STUDENT", "PARENT", "COURSE", "PRIVATE_TUTOR", "SCHOOL_TEACHER", "ADMIN"];
const statuses = ["PENDING", "ACTIVE", "SUSPENDED", "DELETED"];

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState({ page: 1, perPage: 10, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const loadUsers = async ({ page = 1, search = debouncedSearch, role = roleFilter, status = statusFilter } = {}) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetchUsers({ page, perPage: 10, search, role, status });
      setUsers(response.data || []);
      setMeta(response.meta || { page, perPage: 10, total: 0, totalPages: 1 });
    } catch {
      setError("İstifadəçilər yüklənmədi.");
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    loadUsers({ page: 1 });
  }, [debouncedSearch, roleFilter, statusFilter]);

  const runUserAction = async (user, action) => {
    try {
      await action(user.id);
      await loadUsers({ page: meta.page });
    } catch {
      setError("İstifadəçi əməliyyatı alınmadı.");
    }
  };

  const actionsFor = (user) => {
    const items = [{ label: "Edit", href: `/admin/users/${user.id}/edit`, icon: "ph ph-pencil-simple" }];
    if (user.status === "DELETED") {
      items.push({ label: "Restore", icon: "ph ph-arrow-clockwise", onClick: () => runUserAction(user, restoreUser) });
    } else {
      items.push({ label: "Delete", icon: "ph ph-trash", danger: true, onClick: () => runUserAction(user, deleteUser) });
    }
    return items;
  };

  return (
    <div className='px-24 py-24'>
      <div className='bg-white rounded-10 px-24 py-24'>
        <div className='d-flex flex-wrap align-items-center justify-content-between gap-16 mb-24'>
          <div>
            <h4 className='fw-semibold text-neutral-500 text-20 mb-4'><StaticText text={"Users"} /></h4>
            <p className='text-14 text-neutral-400 mb-0'><StaticText text={"Admin user management from /admin/users."} /></p>
          </div>
          <div className='d-flex flex-wrap align-items-center gap-8'>
            <Link href='/admin/users/new' className='btn btn-main rounded-pill px-20'><StaticText text={"Create User"} /></Link>
            <AdminRefreshButton isLoading={isLoading} onClick={() => loadUsers({ page: meta.page })} />
          </div>
        </div>

        <div className='d-flex flex-wrap align-items-center gap-12 mb-24'>
          <div className='position-relative flex-grow-1 min-w-240-px'>
            <input type='search' className='common-input rounded-pill ps-16 pe-44' aria-label='Ad və ya email üzrə axtar' placeholder='Ad və ya email üzrə axtar...' value={searchInput} onChange={(event) => setSearchInput(event.target.value)} />
            <span className='position-absolute top-50 translate-middle-y inset-inline-end-0 me-16 text-neutral-400'><i className='ph ph-magnifying-glass' aria-hidden='true'></i></span>
          </div>
          <select className='form-select rounded-pill border-neutral-40 text-14 py-11 px-16 w-auto min-w-180-px' value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
            <StaticOption value='' text={"All roles"} />
            {roles.map((role) => <option value={role} key={role}>{role.replaceAll("_", " ")}</option>)}
          </select>
          <select className='form-select rounded-pill border-neutral-40 text-14 py-11 px-16 w-auto min-w-160-px' value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <StaticOption value='' text={"All statuses"} />
            {statuses.map((status) => <option value={status} key={status}>{status}</option>)}
          </select>
        </div>

        {error ? <p className='text-danger mb-16'>{error}</p> : null}

        <div className='table-responsive admin-users-table'>
          <table className='table mb-0'>
            <thead>
              <tr>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'><StaticText text={"Name"} /></th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'><StaticText text={"Email"} /></th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'><StaticText text={"Role"} /></th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'><StaticText text={"Status"} /></th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20 text-end'><StaticText text={"Action"} /></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <AdminTableSkeleton columns={5} />
              ) : users.length ? (
                users.map((user) => (
                  <tr key={user.id}>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{user.name}</td>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{user.email || "-"}</td>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{(user.roles || [user.role]).filter(Boolean).join(", ") || "-"}</td>
                    <td className='py-16 px-20'><AdminStatusBadge status={user.status || "ACTIVE"} /></td>
                    <td className='py-16 px-20'><div className='d-flex justify-content-end'><AdminRowActions items={actionsFor(user)} /></div></td>
                  </tr>
                ))
              ) : (
                <AdminEmptyState columns={5} icon='ph ph-users' action={{ href: "/admin/users/new", label: <StaticText text={"Create User"} /> }}>
                  <StaticText text={"No users found."} />
                </AdminEmptyState>
              )}
            </tbody>
          </table>
        </div>

        <AdminPagination meta={meta} onPageChange={(page) => loadUsers({ page })} />
      </div>
    </div>
  );
};

export default AdminUsersPage;
