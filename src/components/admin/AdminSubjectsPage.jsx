"use client";

import { useEffect, useState } from "react";
import AdminRefreshButton from "@/components/admin/AdminRefreshButton";
import AdminRowActions from "@/components/admin/AdminRowActions";
import AdminStatusBadge from "@/components/admin/AdminStatusBadge";
import { fetchSubjects } from "@/lib/api";

const AdminSubjectsPage = () => {
  const [subjects, setSubjects] = useState([]);
  const [meta, setMeta] = useState({ page: 1, perPage: 10, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSubjects = async (page = 1) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetchSubjects({ page, perPage: 10 });
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
    loadSubjects();
  }, []);

  const actionsFor = (subject) => [
    { label: "Topics", href: `/admin/courses/${subject.code}/topics`, icon: "ph ph-list-bullets" },
  ];

  return (
    <div className='px-24 py-24'>
      <div className='bg-white rounded-10 px-24 py-24'>
        <div className='d-flex flex-wrap align-items-center justify-content-between gap-16 mb-24'>
          <div>
            <h4 className='fw-semibold text-neutral-500 text-20 mb-4'>Subjects</h4>
            <p className='text-14 text-neutral-400 mb-0'>Active subjects from the taxonomy API.</p>
          </div>
          <AdminRefreshButton isLoading={isLoading} onClick={() => loadSubjects(meta.page)} />
        </div>

        {error ? <p className='text-danger mb-16'>{error}</p> : null}

        <div className='table-responsive admin-users-table'>
          <table className='table mb-0'>
            <thead>
              <tr>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Subject</th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Code</th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Topics</th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Status</th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20 text-end'>Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td className='py-20 px-20 text-neutral-400' colSpan='5'>Loading...</td></tr>
              ) : subjects.length ? (
                subjects.map((subject) => (
                  <tr key={subject.id || subject.code}>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{subject.name}</td>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{subject.code || "-"}</td>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{subject.topicCount}</td>
                    <td className='py-16 px-20'><AdminStatusBadge status='ACTIVE' /></td>
                    <td className='py-16 px-20'><div className='d-flex justify-content-end'><AdminRowActions items={actionsFor(subject)} /></div></td>
                  </tr>
                ))
              ) : (
                <tr><td className='py-20 px-20 text-neutral-400' colSpan='5'>No subjects found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className='admin-users-mobile-list flex-column gap-12'>
          {isLoading ? (
            <div className='border border-neutral-30 rounded-8 px-16 py-16 text-neutral-400'>Loading...</div>
          ) : subjects.length ? (
            subjects.map((subject) => (
              <div className='border border-neutral-30 rounded-8 px-16 py-16' key={subject.id || subject.code}>
                <div className='d-flex align-items-start justify-content-between gap-12 mb-12'>
                  <div>
                    <h6 className='text-15 text-neutral-500 fw-medium mb-4'>{subject.name}</h6>
                    <p className='text-13 text-neutral-400 mb-0'>Code: {subject.code || "-"} | Topics: {subject.topicCount}</p>
                  </div>
                  <AdminRowActions items={actionsFor(subject)} />
                </div>
                <AdminStatusBadge status='ACTIVE' />
              </div>
            ))
          ) : (
            <div className='border border-neutral-30 rounded-8 px-16 py-16 text-neutral-400'>No subjects found.</div>
          )}
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
