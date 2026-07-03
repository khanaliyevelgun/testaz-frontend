"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import AdminRefreshButton from "@/components/admin/AdminRefreshButton";
import { deleteUser, fetchUsers } from "@/lib/api";

const roleLabels = {
  admin: "Admin",
  parent: "Parent",
  child: "Child",
};

const UserActions = ({ user, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className='dropdown position-relative' ref={dropdownRef}>
      <button
        type='button'
        className='w-36 h-36 rounded-circle border border-neutral-30 text-neutral-500 flex-center bg-white'
        aria-label='Istifadeci emeliyyatlari'
        aria-expanded={isOpen}
        onClick={() => setIsOpen((currentValue) => !currentValue)}
      >
        <i className='ph-bold ph-dots-three-vertical'></i>
      </button>
      {isOpen ? (
        <ul
          className='dropdown-menu rounded-12 show p-8 shadow-md border border-neutral-30'
          style={{ insetInlineEnd: 0, insetInlineStart: "auto", minWidth: 160 }}
        >
          <li>
            <Link
              href={`/admin/users/${user.id}/edit`}
              className='dropdown-item d-flex align-items-center gap-10 rounded-8'
              onClick={() => setIsOpen(false)}
            >
              <i className='ph ph-pencil-simple'></i>
              Edit
            </Link>
          </li>
          <li>
            <button
              type='button'
              className='dropdown-item d-flex align-items-center gap-10 rounded-8 text-danger'
              onClick={() => {
                setIsOpen(false);
                onDelete(user);
              }}
            >
              <i className='ph ph-trash'></i>
              Delete
            </button>
          </li>
        </ul>
      ) : null}
    </div>
  );
};

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState({ page: 1, perPage: 10, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const loadUsers = async ({ page = 1, search = debouncedSearch, role = roleFilter } = {}) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetchUsers({ page, perPage: 10, search, role });
      setUsers(response.data || []);
      setMeta(response.meta || { page, perPage: 10, total: 0, totalPages: 1 });
    } catch {
      setError("Istifadeciler yuklenmedi.");
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 350);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    loadUsers({ page: 1, search: debouncedSearch, role: roleFilter });
  }, [debouncedSearch, roleFilter]);

  const handleDelete = async (user) => {
    const confirmed = window.confirm(`${user.name} istifadecisini silmek istediyinize eminsiniz?`);
    if (!confirmed) return;

    try {
      await deleteUser(user.id);
      setUsers((currentUsers) => currentUsers.filter((currentUser) => currentUser.id !== user.id));
      setMeta((currentMeta) => ({
        ...currentMeta,
        total: Math.max((currentMeta.total || 0) - 1, 0),
      }));
    } catch {
      setError("Istifadeci silinmedi.");
    }
  };

  const renderRole = (role) => (
    <span className='px-12 py-4 bg-main-25 text-main-600 rounded-pill text-12 fw-medium'>
      {roleLabels[role] || role}
    </span>
  );

  return (
    <div className='px-24 py-24'>
      <div className='bg-white rounded-10 px-24 py-24'>
        <div className='d-flex flex-wrap align-items-center justify-content-between gap-16 mb-24'>
          <div>
            <h4 className='fw-semibold text-neutral-500 text-20 mb-4'>Istifadeciler</h4>
            <p className='text-14 text-neutral-400 mb-0'>Sistemdeki istifadeci hesablari</p>
          </div>
          <AdminRefreshButton isLoading={isLoading} onClick={() => loadUsers({ page: meta.page })} />
        </div>

        <div className='d-flex flex-wrap align-items-center gap-12 mb-24'>
          <div className='position-relative flex-grow-1 min-w-240-px'>
            <input
              type='search'
              className='common-input rounded-pill ps-16 pe-44'
              placeholder='Ad, soyad veya email axtar...'
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
            <span className='position-absolute top-50 translate-middle-y inset-inline-end-0 me-16 text-neutral-400'>
              <i className='ph ph-magnifying-glass'></i>
            </span>
          </div>
          <select
            className='form-select rounded-pill border-neutral-40 text-14 py-11 px-16 w-auto min-w-160-px'
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
          >
            <option value=''>Butun roller</option>
            <option value='admin'>Admin</option>
            <option value='parent'>Parent</option>
            <option value='child'>Child</option>
          </select>
        </div>

        {error ? <p className='text-danger mb-16'>{error}</p> : null}

        <div className='table-responsive admin-users-table'>
          <table className='table mb-0'>
            <thead>
              <tr>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Ad Soyad</th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Email</th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Yetki</th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20 text-end'>Emeliyyat</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td className='py-20 px-20 text-neutral-400' colSpan='4'>
                    Yuklenir...
                  </td>
                </tr>
              ) : users.length ? (
                users.map((user) => (
                  <tr key={user.id}>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{user.name}</td>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{user.email}</td>
                    <td className='py-16 px-20'>{renderRole(user.role)}</td>
                    <td className='py-16 px-20'>
                      <div className='d-flex justify-content-end'>
                        <UserActions user={user} onDelete={handleDelete} />
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className='py-20 px-20 text-neutral-400' colSpan='4'>
                    Istifadeci tapilmadi.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className='admin-users-mobile-list flex-column gap-12'>
          {isLoading ? (
            <div className='border border-neutral-30 rounded-8 px-16 py-16 text-neutral-400'>Yuklenir...</div>
          ) : users.length ? (
            users.map((user) => (
              <div className='border border-neutral-30 rounded-8 px-16 py-16' key={user.id}>
                <div className='d-flex align-items-start justify-content-between gap-12 mb-12'>
                  <div>
                    <h6 className='text-15 text-neutral-500 fw-medium mb-4'>{user.name}</h6>
                    <p className='text-13 text-neutral-400 mb-0'>{user.email}</p>
                  </div>
                  <UserActions user={user} onDelete={handleDelete} />
                </div>
                {renderRole(user.role)}
              </div>
            ))
          ) : (
            <div className='border border-neutral-30 rounded-8 px-16 py-16 text-neutral-400'>
              Istifadeci tapilmadi.
            </div>
          )}
        </div>

        <div className='d-flex align-items-center justify-content-end gap-8 mt-24'>
          <button
            type='button'
            className='px-14 py-8 border border-neutral-40 rounded-8 text-14 text-neutral-500'
            disabled={meta.page <= 1}
            onClick={() => loadUsers({ page: Math.max(meta.page - 1, 1) })}
          >
            Evvelki
          </button>
          <span className='text-14 text-neutral-400'>
            {meta.page} / {meta.totalPages}
          </span>
          <button
            type='button'
            className='px-14 py-8 border border-neutral-40 rounded-8 text-14 text-neutral-500'
            disabled={meta.page >= meta.totalPages}
            onClick={() => loadUsers({ page: Math.min(meta.page + 1, meta.totalPages) })}
          >
            Novbeti
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminUsersPage;
