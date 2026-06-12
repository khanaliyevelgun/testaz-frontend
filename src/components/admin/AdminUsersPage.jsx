"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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
        aria-label='İstifadəçi əməliyyatları'
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

  const loadUsers = async (page = 1) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetchUsers({ page, perPage: 10 });
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
    loadUsers();
  }, []);

  const handleDelete = async (user) => {
    const confirmed = window.confirm(`${user.name} istifadəçisini silmək istədiyinizə əminsiniz?`);
    if (!confirmed) return;

    try {
      await deleteUser(user.id);
      setUsers((currentUsers) => currentUsers.filter((currentUser) => currentUser.id !== user.id));
      setMeta((currentMeta) => ({
        ...currentMeta,
        total: Math.max((currentMeta.total || 0) - 1, 0),
      }));
    } catch {
      setError("İstifadəçi silinmədi.");
    }
  };

  return (
    <div className='px-24 py-24'>
      <div className='bg-white rounded-10 px-24 py-24'>
        <div className='d-flex align-items-center justify-content-between gap-16 mb-24'>
          <div>
            <h4 className='fw-semibold text-neutral-500 text-20 mb-4'>İstifadəçilər</h4>
            <p className='text-14 text-neutral-400 mb-0'>Sistemdəki istifadəçi hesabları</p>
          </div>
        </div>

        {error ? <p className='text-danger mb-16'>{error}</p> : null}

        <div className='table-responsive'>
          <table className='table mb-0'>
            <thead>
              <tr>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Ad Soyad</th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Email</th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Yetki</th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20 text-end'>Əməliyyat</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td className='py-20 px-20 text-neutral-400' colSpan='4'>
                    Yüklənir...
                  </td>
                </tr>
              ) : users.length ? (
                users.map((user) => (
                  <tr key={user.id}>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{user.name}</td>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{user.email}</td>
                    <td className='py-16 px-20'>
                      <span className='px-12 py-4 bg-main-25 text-main-600 rounded-pill text-12 fw-medium'>
                        {roleLabels[user.role] || user.role}
                      </span>
                    </td>
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
                    İstifadəçi tapılmadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className='d-flex align-items-center justify-content-end gap-8 mt-24'>
          <button
            type='button'
            className='px-14 py-8 border border-neutral-40 rounded-8 text-14 text-neutral-500'
            disabled={meta.page <= 1}
            onClick={() => loadUsers(Math.max(meta.page - 1, 1))}
          >
            Əvvəlki
          </button>
          <span className='text-14 text-neutral-400'>
            {meta.page} / {meta.totalPages}
          </span>
          <button
            type='button'
            className='px-14 py-8 border border-neutral-40 rounded-8 text-14 text-neutral-500'
            disabled={meta.page >= meta.totalPages}
            onClick={() => loadUsers(Math.min(meta.page + 1, meta.totalPages))}
          >
            Növbəti
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminUsersPage;
