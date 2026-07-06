"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AdminStatusBadge from "@/components/admin/AdminStatusBadge";
import { fetchExam } from "@/lib/api";

const formatDate = (value) => {
  if (!value) return "-";
  return new Intl.DateTimeFormat("az-AZ", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
};

const getExamCode = (exam) => exam?.examCode || exam?.shareToken || exam?.code || "";

const getPreviewPath = (exam) => {
  const code = getExamCode(exam);
  return code ? `/exam/${encodeURIComponent(code)}` : "";
};

const getPreviewUrl = (exam) => {
  const path = getPreviewPath(exam);
  if (!path) return "";
  if (typeof window === "undefined") return path;
  return `${window.location.origin}${path}`;
};

const AdminExamDetailPage = ({ examId }) => {
  const [exam, setExam] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [copyStatus, setCopyStatus] = useState("");

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError("");
    fetchExam(examId)
      .then((response) => {
        if (isMounted) setExam(response);
      })
      .catch((requestError) => {
        if (isMounted) setError(requestError?.message || "Exam could not be loaded.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [examId]);

  const copyLink = async () => {
    const code = getExamCode(exam);
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopyStatus("Copied");
    } catch {
      setCopyStatus("Select the code and copy manually");
    }
  };

  return (
    <div className='px-24 py-24'>
      <div className='bg-white rounded-10 px-24 py-24'>
        <div className='d-flex flex-wrap align-items-center justify-content-between gap-16 mb-24'>
          <div>
            <h4 className='fw-semibold text-neutral-500 text-20 mb-4'>Exam Detail</h4>
            <p className='text-14 text-neutral-400 mb-0'>{examId}</p>
          </div>
          <div className='d-flex flex-wrap align-items-center gap-8'>
            <Link href='/admin/exams' className='px-18 py-10 border border-neutral-40 rounded-pill text-14 text-neutral-500 bg-white'>Exams</Link>
            <Link href={`/admin/exams/${examId}/statistics`} className='px-18 py-10 border border-neutral-40 rounded-pill text-14 text-neutral-500 bg-white'>Statistics</Link>
            <Link href={`/admin/exams/${examId}/attempts`} className='btn btn-main rounded-pill px-20'>Attempts</Link>
          </div>
        </div>

        {isLoading ? <p className='text-14 text-neutral-400 mb-0'>Loading...</p> : null}
        {error ? <p className='text-danger mb-0'>{error}</p> : null}

        {exam ? (
          <>
            <div className='row gy-3 mb-24'>
              <div className='col-md-6'>
                <div className='border border-neutral-30 rounded-12 p-16 h-100'>
                  <span className='text-13 text-neutral-400 d-block mb-4'>Title</span>
                  <strong className='text-16 text-neutral-500'>{exam.title || "Untitled exam"}</strong>
                  {exam.description ? <p className='text-14 text-neutral-400 mt-8 mb-0'>{exam.description}</p> : null}
                </div>
              </div>
              <div className='col-md-2'><div className='border border-neutral-30 rounded-12 p-16 h-100'><span className='text-13 text-neutral-400 d-block mb-4'>Status</span><AdminStatusBadge status={exam.status} /></div></div>
              <div className='col-md-2'><div className='border border-neutral-30 rounded-12 p-16 h-100'><span className='text-13 text-neutral-400 d-block mb-4'>Questions</span><strong className='text-16 text-neutral-500'>{exam.totalQuestions ?? "-"}</strong></div></div>
              <div className='col-md-2'><div className='border border-neutral-30 rounded-12 p-16 h-100'><span className='text-13 text-neutral-400 d-block mb-4'>Max score</span><strong className='text-16 text-neutral-500'>{exam.totalMaxScore ?? "-"}</strong></div></div>
              <div className='col-md-3'><div className='border border-neutral-30 rounded-12 p-16 h-100'><span className='text-13 text-neutral-400 d-block mb-4'>Visibility</span><strong className='text-15 text-neutral-500'>{exam.visibility || "-"}</strong></div></div>
              <div className='col-md-3'><div className='border border-neutral-30 rounded-12 p-16 h-100'><span className='text-13 text-neutral-400 d-block mb-4'>Scoring</span><strong className='text-15 text-neutral-500'>{exam.scoringPolicy || "-"}</strong></div></div>
              <div className='col-md-3'><div className='border border-neutral-30 rounded-12 p-16 h-100'><span className='text-13 text-neutral-400 d-block mb-4'>Duration</span><strong className='text-15 text-neutral-500'>{exam.durationMinutes ? `${exam.durationMinutes} min` : "Untimed"}</strong></div></div>
              <div className='col-md-3'><div className='border border-neutral-30 rounded-12 p-16 h-100'><span className='text-13 text-neutral-400 d-block mb-4'>Created</span><strong className='text-15 text-neutral-500'>{formatDate(exam.createdAt)}</strong></div></div>
            </div>

            <div className='mb-24'>
              <label className='text-14 text-neutral-500 fw-medium mb-8'>Exam code</label>
              <div className='d-flex flex-wrap align-items-center gap-10'>
                <input className='common-input rounded-pill flex-grow-1 min-w-240-px' readOnly value={getExamCode(exam)} onFocus={(event) => event.target.select()} />
                <button type='button' className='btn btn-main rounded-pill px-20' onClick={copyLink}>Copy</button>
              </div>
              {copyStatus ? <p className='text-14 text-neutral-400 mt-8 mb-0'>{copyStatus}</p> : null}
              {getPreviewUrl(exam) ? (
                <div className='mt-16'>
                  <label className='text-14 text-neutral-500 fw-medium mb-8'>Preview link</label>
                  <div className='d-flex flex-wrap align-items-center gap-10'>
                    <input className='common-input rounded-pill flex-grow-1 min-w-240-px' readOnly value={getPreviewUrl(exam)} onFocus={(event) => event.target.select()} />
                    <Link className='btn btn-main rounded-pill px-20' href={getPreviewPath(exam)}>Preview</Link>
                  </div>
                </div>
              ) : null}
            </div>

            <h5 className='text-16 fw-semibold text-neutral-500 mb-12'>Sections</h5>
            <div className='table-responsive admin-users-table'>
              <table className='table mb-0'>
                <thead>
                  <tr>
                    <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Section</th>
                    <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Subject</th>
                    <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Type</th>
                    <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Difficulty</th>
                    <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Questions</th>
                    <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Points</th>
                  </tr>
                </thead>
                <tbody>
                  {exam.sections?.length ? (
                    exam.sections.map((section) => (
                      <tr key={section.sectionId || section.orderIndex}>
                        <td className='py-16 px-20 text-14 text-neutral-500'>{section.title || `Section ${Number(section.orderIndex || 0) + 1}`}</td>
                        <td className='py-16 px-20 text-14 text-neutral-500'>#{section.subjectId}</td>
                        <td className='py-16 px-20 text-14 text-neutral-500'>{section.typeFilter || "-"}</td>
                        <td className='py-16 px-20 text-14 text-neutral-500'>{section.difficultyFilter || "-"}</td>
                        <td className='py-16 px-20 text-14 text-neutral-500'>{section.questionCount ?? "-"}</td>
                        <td className='py-16 px-20 text-14 text-neutral-500'>{section.pointsCorrect ?? "-"} / -{section.penaltyWrong ?? 0}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td className='py-20 px-20 text-neutral-400' colSpan='6'>No sections found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default AdminExamDetailPage;
