"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchExamAttempts } from "@/lib/api";
import { formatDateTime as formatDate } from "@/lib/format";
import StaticText from "@/components/StaticText";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import AdminTableSkeleton from "@/components/admin/AdminTableSkeleton";
import AdminPagination from "@/components/admin/AdminPagination";


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
      setError(requestError?.message || "Cəhdlər yüklənmədi.");
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
            <h4 className='fw-semibold text-neutral-500 text-20 mb-4'><StaticText text={"Exam Attempts"} /></h4>
            <p className='text-14 text-neutral-400 mb-0'>{examId}</p>
          </div>
          <div className='d-flex flex-wrap align-items-center gap-8'>
            <Link href={`/admin/exams/${examId}`} className='px-18 py-10 border border-neutral-40 rounded-pill text-14 text-neutral-500 bg-white'><StaticText text={"Details"} /></Link>
            <Link href={`/admin/exams/${examId}/statistics`} className='btn btn-main rounded-pill px-20'><StaticText text={"Statistics"} /></Link>
          </div>
        </div>

        {error ? <p className='text-danger mb-16'>{error}</p> : null}

        <div className='table-responsive admin-users-table'>
          <table className='table mb-0'>
            <thead>
              <tr>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'><StaticText text={"Student"} /></th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'><StaticText text={"Session"} /></th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'><StaticText text={"Score"} /></th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'><StaticText text={"Percentage"} /></th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'><StaticText text={"Correct"} /></th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'><StaticText text={"Scored"} /></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <AdminTableSkeleton columns={6} />
              ) : attempts.length ? (
                attempts.map((attempt) => (
                  <tr key={attempt.id || attempt.sessionId}>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{attempt.studentName || attempt.studentId || "-"}</td>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{attempt.sessionId || "-"}</td>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{attempt.totalScore ?? "-"} / {attempt.maxScore ?? "-"}</td>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{attempt.percentage != null ? `${attempt.percentage}%` : "-"}</td>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{attempt.correctCount ?? "-"} / {attempt.totalQuestions ?? "-"}</td>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{formatDate(attempt.scoredAt)}</td>
                  </tr>
                ))
              ) : (
                <AdminEmptyState columns={6} icon='ph ph-chart-bar'><StaticText text={"No attempts found."} /></AdminEmptyState>
              )}
            </tbody>
          </table>
        </div>

        <AdminPagination meta={meta} onPageChange={loadAttempts} />
      </div>
    </div>
  );
};

export default AdminExamAttemptsPage;
