"use client";

import { useEffect, useState } from "react";
import AdminRowActions from "@/components/admin/AdminRowActions";
import { createTopic, deleteTopic, fetchTopics } from "@/lib/api";

const StatusBadge = ({ status }) => (
  <span className={`px-12 py-4 rounded-pill text-12 fw-medium ${status === "active" ? "bg-success-50 text-success-600" : "bg-warning-50 text-warning-700"}`}>
    {status === "active" ? "Aktiv" : "Deaktiv"}
  </span>
);

const AdminTopicsPage = ({ subjectId }) => {
  const [topics, setTopics] = useState([]);
  const [meta, setMeta] = useState({ page: 1, perPage: 10, total: 0, totalPages: 1 });
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadTopics = async (page = 1) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetchTopics(subjectId, { page, perPage: 10 });
      setTopics(response.data || []);
      setMeta(response.meta || { page, perPage: 10, total: 0, totalPages: 1 });
    } catch {
      setError("Mövzular yüklənmədi.");
      setTopics([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTopics();
  }, [subjectId]);

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!name.trim()) return;

    try {
      const topic = await createTopic(subjectId, { name: name.trim() });
      setTopics((current) => [topic, ...current]);
      setName("");
    } catch {
      setError("Mövzu yaradılmadı.");
    }
  };

  const handleDelete = async (topic) => {
    if (!window.confirm(`${topic.name} mövzusunu silmək istədiyinizə əminsiniz?`)) return;

    try {
      await deleteTopic(subjectId, topic.id);
      setTopics((current) => current.filter((item) => item.id !== topic.id));
    } catch {
      setError("Mövzu silinmədi.");
    }
  };

  const actionsFor = (topic) => [
    { label: "Edit", href: `/admin/courses/${subjectId}/topics/${topic.id}/edit`, icon: "ph ph-pencil-simple" },
    { label: "Sil", icon: "ph ph-trash", danger: true, onClick: () => handleDelete(topic) },
  ];

  return (
    <div className='px-24 py-24'>
      <div className='bg-white rounded-10 px-24 py-24'>
        <div className='mb-24'>
          <h4 className='fw-semibold text-neutral-500 text-20 mb-4'>Mövzular</h4>
          <p className='text-14 text-neutral-400 mb-0'>Fənn daxilində mövzu bölmələrini yaradın.</p>
        </div>

        <form className='d-flex flex-wrap align-items-center gap-12 mb-24' onSubmit={handleCreate}>
          <input
            type='text'
            className='common-input rounded-pill flex-grow-1 min-w-240-px'
            placeholder='Mövzu adı'
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <button type='submit' className='btn btn-main rounded-pill px-24'>Mövzu yarat</button>
        </form>

        {error ? <p className='text-danger mb-16'>{error}</p> : null}

        <div className='table-responsive admin-users-table'>
          <table className='table mb-0'>
            <thead>
              <tr>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Mövzu adı</th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Sual sayı</th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Status</th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20 text-end'>Əməliyyat</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td className='py-20 px-20 text-neutral-400' colSpan='4'>Yüklənir...</td></tr>
              ) : topics.length ? (
                topics.map((topic) => (
                  <tr key={topic.id}>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{topic.name}</td>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{topic.questionCount}</td>
                    <td className='py-16 px-20'><StatusBadge status={topic.status} /></td>
                    <td className='py-16 px-20'><div className='d-flex justify-content-end'><AdminRowActions items={actionsFor(topic)} /></div></td>
                  </tr>
                ))
              ) : (
                <tr><td className='py-20 px-20 text-neutral-400' colSpan='4'>Mövzu tapılmadı.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className='admin-users-mobile-list flex-column gap-12'>
          {isLoading ? (
            <div className='border border-neutral-30 rounded-8 px-16 py-16 text-neutral-400'>Yüklənir...</div>
          ) : topics.length ? (
            topics.map((topic) => (
              <div className='border border-neutral-30 rounded-8 px-16 py-16' key={topic.id}>
                <div className='d-flex align-items-start justify-content-between gap-12 mb-12'>
                  <div>
                    <h6 className='text-15 text-neutral-500 fw-medium mb-4'>{topic.name}</h6>
                    <p className='text-13 text-neutral-400 mb-0'>Sual sayı: {topic.questionCount}</p>
                  </div>
                  <AdminRowActions items={actionsFor(topic)} />
                </div>
                <StatusBadge status={topic.status} />
              </div>
            ))
          ) : (
            <div className='border border-neutral-30 rounded-8 px-16 py-16 text-neutral-400'>Mövzu tapılmadı.</div>
          )}
        </div>

        <div className='d-flex align-items-center justify-content-end gap-8 mt-24'>
          <button type='button' className='px-14 py-8 border border-neutral-40 rounded-8 text-14 text-neutral-500' disabled={meta.page <= 1} onClick={() => loadTopics(Math.max(meta.page - 1, 1))}>Əvvəlki</button>
          <span className='text-14 text-neutral-400'>{meta.page} / {meta.totalPages}</span>
          <button type='button' className='px-14 py-8 border border-neutral-40 rounded-8 text-14 text-neutral-500' disabled={meta.page >= meta.totalPages} onClick={() => loadTopics(Math.min(meta.page + 1, meta.totalPages))}>Növbəti</button>
        </div>
      </div>
    </div>
  );
};

export default AdminTopicsPage;
