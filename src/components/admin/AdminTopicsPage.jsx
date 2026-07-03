"use client";

import { useEffect, useState } from "react";
import AdminRefreshButton from "@/components/admin/AdminRefreshButton";
import AdminStatusBadge from "@/components/admin/AdminStatusBadge";
import { fetchTopics } from "@/lib/api";

const AdminTopicsPage = ({ subjectId }) => {
  const [topics, setTopics] = useState([]);
  const [meta, setMeta] = useState({ page: 1, perPage: 10, total: 0, totalPages: 1 });
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
      setError("Topics could not be loaded.");
      setTopics([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTopics();
  }, [subjectId]);

  return (
    <div className='px-24 py-24'>
      <div className='bg-white rounded-10 px-24 py-24'>
        <div className='d-flex flex-wrap align-items-center justify-content-between gap-16 mb-24'>
          <div>
            <h4 className='fw-semibold text-neutral-500 text-20 mb-4'>Topics</h4>
            <p className='text-14 text-neutral-400 mb-0'>Subject code: {subjectId}</p>
          </div>
          <AdminRefreshButton isLoading={isLoading} onClick={() => loadTopics(meta.page)} />
        </div>

        {error ? <p className='text-danger mb-16'>{error}</p> : null}

        <div className='table-responsive admin-users-table'>
          <table className='table mb-0'>
            <thead>
              <tr>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Topic</th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Code</th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Questions</th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td className='py-20 px-20 text-neutral-400' colSpan='4'>Loading...</td></tr>
              ) : topics.length ? (
                topics.map((topic) => (
                  <tr key={topic.id || topic.code}>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{topic.name}</td>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{topic.code || "-"}</td>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{topic.questionCount}</td>
                    <td className='py-16 px-20'><AdminStatusBadge status='ACTIVE' /></td>
                  </tr>
                ))
              ) : (
                <tr><td className='py-20 px-20 text-neutral-400' colSpan='4'>No topics found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className='admin-users-mobile-list flex-column gap-12'>
          {isLoading ? (
            <div className='border border-neutral-30 rounded-8 px-16 py-16 text-neutral-400'>Loading...</div>
          ) : topics.length ? (
            topics.map((topic) => (
              <div className='border border-neutral-30 rounded-8 px-16 py-16' key={topic.id || topic.code}>
                <h6 className='text-15 text-neutral-500 fw-medium mb-4'>{topic.name}</h6>
                <p className='text-13 text-neutral-400 mb-12'>Code: {topic.code || "-"} | Questions: {topic.questionCount}</p>
                <AdminStatusBadge status='ACTIVE' />
              </div>
            ))
          ) : (
            <div className='border border-neutral-30 rounded-8 px-16 py-16 text-neutral-400'>No topics found.</div>
          )}
        </div>

        <div className='d-flex align-items-center justify-content-end gap-8 mt-24'>
          <button type='button' className='px-14 py-8 border border-neutral-40 rounded-8 text-14 text-neutral-500' disabled={meta.page <= 1} onClick={() => loadTopics(Math.max(meta.page - 1, 1))}>Previous</button>
          <span className='text-14 text-neutral-400'>{meta.page} / {meta.totalPages}</span>
          <button type='button' className='px-14 py-8 border border-neutral-40 rounded-8 text-14 text-neutral-500' disabled={meta.page >= meta.totalPages} onClick={() => loadTopics(Math.min(meta.page + 1, meta.totalPages))}>Next</button>
        </div>
      </div>
    </div>
  );
};

export default AdminTopicsPage;
