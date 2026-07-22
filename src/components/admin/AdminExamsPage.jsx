"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AdminRefreshButton from "@/components/admin/AdminRefreshButton";
import AdminRowActions from "@/components/admin/AdminRowActions";
import AdminStatusBadge from "@/components/admin/AdminStatusBadge";
import AdminPagination from "@/components/admin/AdminPagination";
import { fetchExams } from "@/lib/api";
import StaticText from "@/components/StaticText";


const formatDate = (value) => {
  if (!value) return "-";
  return new Intl.DateTimeFormat("az-AZ", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
};

const AdminExamsPage = () => {
  const [exams, setExams] = useState([]);
  const [meta, setMeta] = useState({ page: 1, perPage: 10, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadExams = async (page = 1) => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetchExams({ page, perPage: 10 });
      setExams(response.data || []);
      setMeta(response.meta || { page, perPage: 10, total: 0, totalPages: 1 });
    } catch (requestError) {
      setError(requestError?.message || "Exams could not be loaded.");
      setExams([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadExams(1);
  }, []);

  const actionsFor = (exam) => [
    { label: "Details", href: `/admin/exams/${exam.examId}`, icon: "ph ph-eye" },
    { label: "Statistics", href: `/admin/exams/${exam.examId}/statistics`, icon: "ph ph-chart-bar" },
    { label: "Attempts", href: `/admin/exams/${exam.examId}/attempts`, icon: "ph ph-list-checks" },
  ];

  return (
    <div className='px-24 py-24'>
      <div className='bg-white rounded-10 px-24 py-24'>
        <div className='d-flex flex-wrap align-items-center justify-content-between gap-16 mb-24'>
          <div>
            <h4 className='fw-semibold text-neutral-500 text-20 mb-4'><StaticText text={"Exams"} /></h4>
            <p className='text-14 text-neutral-400 mb-0'><StaticText text={"Created exams, links, statistics and attempts."} /></p>
          </div>
          <div className='d-flex flex-wrap align-items-center gap-8'>
            <Link href='/admin/exams/templates' className='px-18 py-10 border border-neutral-40 rounded-pill text-14 text-neutral-500 bg-white'><StaticText text={"Templates"} /></Link>
            <Link href='/admin/exams/new' className='btn btn-main rounded-pill px-20'><StaticText text={"Create Exam"} /></Link>
            <AdminRefreshButton isLoading={isLoading} onClick={() => loadExams(meta.page)} />
          </div>
        </div>

        {error ? <p className='text-danger mb-16'>{error}</p> : null}

        <div className='table-responsive admin-users-table'>
          <table className='table mb-0'>
            <thead>
              <tr>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'><StaticText text={"Exam"} /></th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'><StaticText text={"Status"} /></th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'><StaticText text={"Visibility"} /></th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'><StaticText text={"Questions"} /></th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'><StaticText text={"Duration"} /></th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'><StaticText text={"Created"} /></th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20 text-end'><StaticText text={"Action"} /></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td className='py-20 px-20 text-neutral-400' colSpan='7'><StaticText text={"Loading..."} /></td></tr>
              ) : exams.length ? (
                exams.map((exam) => (
                  <tr key={exam.examId}>
                    <td className='py-16 px-20'>
                      <Link href={`/admin/exams/${exam.examId}`} className='text-14 fw-medium text-neutral-500'>{exam.title || <StaticText text={"Untitled exam"} />}</Link>
                      <span className='d-block text-12 text-neutral-400'>{exam.examId}</span>
                    </td>
                    <td className='py-16 px-20'><AdminStatusBadge status={exam.status} /></td>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{exam.visibility || "-"}</td>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{exam.totalQuestions ?? "-"}</td>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{exam.durationMinutes ? `${exam.durationMinutes} min` : <StaticText text={"Untimed"} />}</td>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{formatDate(exam.createdAt)}</td>
                    <td className='py-16 px-20'><div className='d-flex justify-content-end'><AdminRowActions items={actionsFor(exam)} /></div></td>
                  </tr>
                ))
              ) : (
                <tr><td className='py-20 px-20 text-neutral-400' colSpan='7'><StaticText text={"No exams found."} /></td></tr>
              )}
            </tbody>
          </table>
        </div>

        <AdminPagination meta={meta} onPageChange={loadExams} />
      </div>
    </div>
  );
};

export default AdminExamsPage;
