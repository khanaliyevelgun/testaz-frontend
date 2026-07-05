"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AdminRefreshButton from "@/components/admin/AdminRefreshButton";
import AdminRowActions from "@/components/admin/AdminRowActions";
import AdminStatusBadge from "@/components/admin/AdminStatusBadge";
import { activateSubject, deactivateSubject, fetchSubjects, updateSubject } from "@/lib/api";

const AdminSubjectsPage = () => {
  const [subjects, setSubjects] = useState([]);
  const [meta, setMeta] = useState({ page: 1, perPage: 10, total: 0, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [active, setActive] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSubjects = async (page = 1) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetchSubjects({ page, perPage: 10, search, active });
      setSubjects(response.data || []);
      setMeta(response.meta || { page, perPage: 10, total: 0, totalPages: 1 });
    } catch {
      setError("Subjects could not be loaded.");
      setSubjects([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSubjects(1);
  }, [search, active]);

  const renameSubject = async (subject) => {
    const nameAz = window.prompt("Name AZ", subject.nameAz || subject.name || "");
    if (nameAz === null || !nameAz.trim()) return;

    try {
      await updateSubject(subject.id, { nameAz: nameAz.trim(), nameEn: subject.nameEn || nameAz.trim() });
      await loadSubjects(meta.page);
    } catch {
      setError("Subject could not be updated.");
    }
  };

  const setSubjectActive = async (subject) => {
    try {
      await (subject.active ? deactivateSubject(subject.id) : activateSubject(subject.id));
      await loadSubjects(meta.page);
    } catch {
      setError("Subject status could not be updated.");
    }
  };

  const actionsFor = (subject) => [
    { label: "Topics", href: `/admin/courses/${subject.id}/topics`, icon: "ph ph-list-bullets" },
    { label: "Edit", href: `/admin/subjects/${subject.id}/edit`, icon: "ph ph-pencil-simple" },
    { label: "Quick rename", icon: "ph ph-text-aa", onClick: () => renameSubject(subject) },
    {
      label: subject.active ? "Deactivate" : "Activate",
      icon: subject.active ? "ph ph-eye-slash" : "ph ph-eye",
      danger: subject.active,
      onClick: () => setSubjectActive(subject),
    },
  ];

  return (
    <div className='px-24 py-24'>
      <div className='bg-white rounded-10 px-24 py-24'>
        <div className='d-flex flex-wrap align-items-center justify-content-between gap-16 mb-24'>
          <div>
            <h4 className='fw-semibold text-neutral-500 text-20 mb-4'>Subjects</h4>
            <p className='text-14 text-neutral-400 mb-0'>Back-office subject management.</p>
          </div>
          <div className='d-flex flex-wrap align-items-center gap-8'>
            <Link href='/admin/subjects/new' className='btn btn-main rounded-pill px-20'>Create Subject</Link>
            <AdminRefreshButton isLoading={isLoading} onClick={() => loadSubjects(meta.page)} />
          </div>
        </div>

        <div className='d-flex flex-wrap align-items-center gap-12 mb-24'>
          <input className='common-input rounded-pill flex-grow-1 min-w-240-px' placeholder='Search subjects...' value={search} onChange={(event) => setSearch(event.target.value)} />
          <select className='form-select rounded-pill border-neutral-40 text-14 py-11 px-16 w-auto min-w-160-px' value={active} onChange={(event) => setActive(event.target.value)}>
            <option value=''>All statuses</option>
            <option value='true'>Active</option>
            <option value='false'>Inactive</option>
          </select>
        </div>

        {error ? <p className='text-danger mb-16'>{error}</p> : null}

        <div className='table-responsive admin-users-table'>
          <table className='table mb-0'>
            <thead>
              <tr>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Subject</th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Code</th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Status</th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20 text-end'>Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td className='py-20 px-20 text-neutral-400' colSpan='4'>Loading...</td></tr>
              ) : subjects.length ? (
                subjects.map((subject) => (
                  <tr key={subject.id}>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{subject.name}</td>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{subject.code || "-"}</td>
                    <td className='py-16 px-20'><AdminStatusBadge status={subject.status} /></td>
                    <td className='py-16 px-20'><div className='d-flex justify-content-end'><AdminRowActions items={actionsFor(subject)} /></div></td>
                  </tr>
                ))
              ) : (
                <tr><td className='py-20 px-20 text-neutral-400' colSpan='4'>No subjects found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className='d-flex align-items-center justify-content-end gap-8 mt-24'>
          <button type='button' className='px-14 py-8 border border-neutral-40 rounded-8 text-14 text-neutral-500' disabled={meta.page <= 1} onClick={() => loadSubjects(Math.max(meta.page - 1, 1))}>Previous</button>
          <span className='text-14 text-neutral-400'>{meta.page} / {meta.totalPages}</span>
          <button type='button' className='px-14 py-8 border border-neutral-40 rounded-8 text-14 text-neutral-500' disabled={meta.page >= meta.totalPages} onClick={() => loadSubjects(Math.min(meta.page + 1, meta.totalPages))}>Next</button>
        </div>
      </div>
    </div>
  );
};

export default AdminSubjectsPage;
