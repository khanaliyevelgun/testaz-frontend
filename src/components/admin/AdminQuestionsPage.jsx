"use client";

import { useEffect, useState } from "react";
import AdminRefreshButton from "@/components/admin/AdminRefreshButton";
import AdminRowActions from "@/components/admin/AdminRowActions";
import AdminStatusBadge from "@/components/admin/AdminStatusBadge";
import {
  approveAdminQuestion,
  archiveAdminQuestion,
  fetchAdminQuestions,
  rejectAdminQuestion,
} from "@/lib/api";

const statuses = ["DRAFT", "PENDING_REVIEW", "ACTIVE", "REJECTED", "ARCHIVED"];

const AdminQuestionsPage = () => {
  const [questions, setQuestions] = useState([]);
  const [meta, setMeta] = useState({ page: 1, perPage: 10, total: 0, totalPages: 1 });
  const [status, setStatus] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadQuestions = async ({ page = 1, nextStatus = status, nextSubjectId = subjectId } = {}) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetchAdminQuestions({
        page,
        perPage: 10,
        status: nextStatus,
        subjectId: nextSubjectId,
      });
      setQuestions(response.data || []);
      setMeta(response.meta || { page, perPage: 10, total: 0, totalPages: 1 });
    } catch {
      setError("Questions could not be loaded.");
      setQuestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions({ page: 1 });
  }, [status, subjectId]);

  const runAction = async (question, action) => {
    try {
      await action(question.id);
      await loadQuestions({ page: meta.page });
    } catch {
      setError("Question action failed.");
    }
  };

  const actionsFor = (question) => [
    { label: "Approve", icon: "ph ph-check", onClick: () => runAction(question, approveAdminQuestion) },
    { label: "Reject", icon: "ph ph-x", danger: true, onClick: () => runAction(question, rejectAdminQuestion) },
    { label: "Archive", icon: "ph ph-archive", onClick: () => runAction(question, archiveAdminQuestion) },
  ];

  return (
    <div className='px-24 py-24'>
      <div className='bg-white rounded-10 px-24 py-24'>
        <div className='d-flex flex-wrap align-items-center justify-content-between gap-16 mb-24'>
          <div>
            <h4 className='fw-semibold text-neutral-500 text-20 mb-4'>Questions</h4>
            <p className='text-14 text-neutral-400 mb-0'>Review generated and manually created questions.</p>
          </div>
          <AdminRefreshButton isLoading={isLoading} onClick={() => loadQuestions({ page: meta.page })} />
        </div>

        <div className='d-flex flex-wrap align-items-center gap-12 mb-24'>
          <input
            type='number'
            className='common-input rounded-pill min-w-180-px'
            placeholder='Subject ID'
            value={subjectId}
            onChange={(event) => setSubjectId(event.target.value)}
          />
          <select
            className='form-select rounded-pill border-neutral-40 text-14 py-11 px-16 w-auto min-w-180-px'
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value=''>All statuses</option>
            {statuses.map((item) => (
              <option value={item} key={item}>{item.replaceAll("_", " ")}</option>
            ))}
          </select>
        </div>

        {error ? <p className='text-danger mb-16'>{error}</p> : null}

        <div className='table-responsive admin-users-table'>
          <table className='table mb-0'>
            <thead>
              <tr>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Question</th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Subject</th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Type</th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Status</th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20 text-end'>Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td className='py-20 px-20 text-neutral-400' colSpan='5'>Loading...</td></tr>
              ) : questions.length ? (
                questions.map((question) => (
                  <tr key={question.id}>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{question.stem || question.id}</td>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{question.subjectId || "-"}</td>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{question.type || "-"}</td>
                    <td className='py-16 px-20'><AdminStatusBadge status={question.status} /></td>
                    <td className='py-16 px-20'><div className='d-flex justify-content-end'><AdminRowActions items={actionsFor(question)} /></div></td>
                  </tr>
                ))
              ) : (
                <tr><td className='py-20 px-20 text-neutral-400' colSpan='5'>No questions found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className='d-flex align-items-center justify-content-end gap-8 mt-24'>
          <button type='button' className='px-14 py-8 border border-neutral-40 rounded-8 text-14 text-neutral-500' disabled={meta.page <= 1} onClick={() => loadQuestions({ page: Math.max(meta.page - 1, 1) })}>Previous</button>
          <span className='text-14 text-neutral-400'>{meta.page} / {meta.totalPages}</span>
          <button type='button' className='px-14 py-8 border border-neutral-40 rounded-8 text-14 text-neutral-500' disabled={meta.page >= meta.totalPages} onClick={() => loadQuestions({ page: Math.min(meta.page + 1, meta.totalPages) })}>Next</button>
        </div>
      </div>
    </div>
  );
};

export default AdminQuestionsPage;
