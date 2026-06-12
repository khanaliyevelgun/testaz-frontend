"use client";

import { useEffect, useState } from "react";
import AdminRowActions from "@/components/admin/AdminRowActions";
import { createSubject, deleteSubject, fetchSubjects } from "@/lib/api";

const statusLabel = {
  active: "Aktiv",
  inactive: "Deaktiv",
};

const StatusBadge = ({ status }) => (
  <span className={`px-12 py-4 rounded-pill text-12 fw-medium ${status === "active" ? "bg-success-50 text-success-600" : "bg-warning-50 text-warning-700"}`}>
    {statusLabel[status] || status}
  </span>
);

const AdminSubjectsPage = () => {
  const [subjects, setSubjects] = useState([]);
  const [meta, setMeta] = useState({ page: 1, perPage: 10, total: 0, totalPages: 1 });
  const [name, setName] = useState("");
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
      setError("Fennler yuklenmedi.");
      setSubjects([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSubjects();
  }, []);

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!name.trim()) return;

    try {
      const subject = await createSubject({ name: name.trim() });
      setSubjects((current) => [subject, ...current]);
      setName("");
    } catch {
      setError("Fenn yaradilmadi.");
    }
  };

  const handleDelete = async (subject) => {
    if (!window.confirm(`${subject.name} fennini silmek istediyinize eminsiniz?`)) return;

    try {
      await deleteSubject(subject.id);
      setSubjects((current) => current.filter((item) => item.id !== subject.id));
    } catch {
      setError("Fenn silinmedi.");
    }
  };

  return (
    <div className='px-24 py-24'>
      <div className='bg-white rounded-10 px-24 py-24'>
        <div className='mb-24'>
          <h4 className='fw-semibold text-neutral-500 text-20 mb-4'>Fənlər</h4>
          <p className='text-14 text-neutral-400 mb-0'>Fənləri yaradın və mövzularını idarə edin.</p>
        </div>

        <form className='d-flex flex-wrap align-items-center gap-12 mb-24' onSubmit={handleCreate}>
          <input
            type='text'
            className='common-input rounded-pill flex-grow-1 min-w-240-px'
            placeholder='Fənn adı'
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <button type='submit' className='btn btn-main rounded-pill px-24'>
            Fənn yarat
          </button>
        </form>

        {error ? <p className='text-danger mb-16'>{error}</p> : null}

        <div className='table-responsive admin-users-table'>
          <table className='table mb-0'>
            <thead>
              <tr>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Fən adı</th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Mövzu sayı</th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Status</th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20 text-end'>Əməliyyat</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td className='py-20 px-20 text-neutral-400' colSpan='4'>Yuklenir...</td></tr>
              ) : subjects.length ? (
                subjects.map((subject) => (
                  <tr key={subject.id}>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{subject.name}</td>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{subject.topicCount}</td>
                    <td className='py-16 px-20'><StatusBadge status={subject.status} /></td>
                    <td className='py-16 px-20'>
                      <div className='d-flex justify-content-end'>
                        <AdminRowActions
                          items={[
                            { label: "Edit", href: `/admin/courses/${subject.id}/edit`, icon: "ph ph-pencil-simple" },
                            { label: "Mövzular", href: `/admin/courses/${subject.id}/topics`, icon: "ph ph-list-bullets" },
                            { label: "Sil", icon: "ph ph-trash", danger: true, onClick: () => handleDelete(subject) },
                          ]}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td className='py-20 px-20 text-neutral-400' colSpan='4'>Fənn tapılmadı.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className='admin-users-mobile-list flex-column gap-12'>
          {isLoading ? (
            <div className='border border-neutral-30 rounded-8 px-16 py-16 text-neutral-400'>Yuklenir...</div>
          ) : subjects.length ? (
            subjects.map((subject) => (
              <div className='border border-neutral-30 rounded-8 px-16 py-16' key={subject.id}>
                <div className='d-flex align-items-start justify-content-between gap-12 mb-12'>
                  <div>
                    <h6 className='text-15 text-neutral-500 fw-medium mb-4'>{subject.name}</h6>
                    <p className='text-13 text-neutral-400 mb-0'>Mövzu sayı: {subject.topicCount}</p>
                  </div>
                  <AdminRowActions
                    items={[
                      { label: "Edit", href: `/admin/courses/${subject.id}/edit`, icon: "ph ph-pencil-simple" },
                      { label: "Mövzular", href: `/admin/courses/${subject.id}/topics`, icon: "ph ph-list-bullets" },
                      { label: "Sil", icon: "ph ph-trash", danger: true, onClick: () => handleDelete(subject) },
                    ]}
                  />
                </div>
                <StatusBadge status={subject.status} />
              </div>
            ))
          ) : (
            <div className='border border-neutral-30 rounded-8 px-16 py-16 text-neutral-400'>Fənn tapılmadı.</div>
          )}
        </div>

        <div className='d-flex align-items-center justify-content-end gap-8 mt-24'>
          <button type='button' className='px-14 py-8 border border-neutral-40 rounded-8 text-14 text-neutral-500' disabled={meta.page <= 1} onClick={() => loadSubjects(Math.max(meta.page - 1, 1))}>Əvvəlki</button>
          <span className='text-14 text-neutral-400'>{meta.page} / {meta.totalPages}</span>
          <button type='button' className='px-14 py-8 border border-neutral-40 rounded-8 text-14 text-neutral-500' disabled={meta.page >= meta.totalPages} onClick={() => loadSubjects(Math.min(meta.page + 1, meta.totalPages))}>Növbəti</button>
        </div>
      </div>
    </div>
  );
};

export default AdminSubjectsPage;
