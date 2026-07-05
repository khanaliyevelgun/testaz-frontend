"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchExamAttempts } from "@/lib/api";

const formatDate = (value) => {
  if (!value) return "-";
  return new Intl.DateTimeFormat("az-AZ", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
};

const AdminExamAttemptsPage = ({ examId }) => {
  const [attempts, setAttempts] = useState([]);
  const [meta, setMeta] = useState({ page: 1, perPage: 10, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAttempts = async (page = 1) => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetchExamAttempts(examId, { page, perPage: 10 });
      setAttempts(response.data || []);
      setMeta(response.meta || { page, perPage: 10, total: 0, totalPages: 1 });
    } catch (requestError) {
      setError(requestError?.message || "Attempts could not be loaded.");
      setAttempts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAttempts(1);
  }, [examId]);

  return (
    <div className='px-24 py-24'>
      <div className='bg-white rounded-10 px-24 py-24'>
        <div className='d-flex flex-wrap align-items-center justify-content-between gap-16 mb-24'>
          <div>
            <h4 className='fw-semibold text-neutral-500 text-20 mb-4'>Exam Attempts</h4>
            <p className='text-14 text-neutral-400 mb-0'>{examId}</p>
          </div>
          <div className='d-flex flex-wrap align-items-center gap-8'>
            <Link href={`/admin/exams/${examId}`} className='px-18 py-10 border border-neutral-40 rounded-pill text-14 text-neutral-500 bg-white'>Details</Link>
            <Link href={`/admin/exams/${examId}/statistics`} className='btn btn-main rounded-pill px-20'>Statistics</Link>
          </div>
        </div>

        {error ? <p className='text-danger mb-16'>{error}</p> : null}

        <div className='table-responsive admin-users-table'>
          <table className='table mb-0'>
            <thead>
              <tr>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Student</th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Session</th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Score</th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Percentage</th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Correct</th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Scored</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td className='py-20 px-20 text-neutral-400' colSpan='6'>Loading...</td></tr>
              ) : attempts.length ? (
                attempts.map((attempt) => (
                  <tr key={attempt.id || attempt.sessionId}>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{attempt.studentId || "-"}</td>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{attempt.sessionId || "-"}</td>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{attempt.totalScore ?? "-"} / {attempt.maxScore ?? "-"}</td>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{attempt.percentage != null ? `${attempt.percentage}%` : "-"}</td>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{attempt.correctCount ?? "-"} / {attempt.totalQuestions ?? "-"}</td>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{formatDate(attempt.scoredAt)}</td>
                  </tr>
                ))
              ) : (
                <tr><td className='py-20 px-20 text-neutral-400' colSpan='6'>No attempts found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className='d-flex align-items-center justify-content-end gap-8 mt-24'>
          <button type='button' className='px-14 py-8 border border-neutral-40 rounded-8 text-14 text-neutral-500' disabled={meta.page <= 1} onClick={() => loadAttempts(Math.max(meta.page - 1, 1))}>Previous</button>
          <span className='text-14 text-neutral-400'>{meta.page} / {meta.totalPages}</span>
          <button type='button' className='px-14 py-8 border border-neutral-40 rounded-8 text-14 text-neutral-500' disabled={meta.page >= meta.totalPages} onClick={() => loadAttempts(Math.min(meta.page + 1, meta.totalPages))}>Next</button>
        </div>
      </div>
    </div>
  );
};

export default AdminExamAttemptsPage;
