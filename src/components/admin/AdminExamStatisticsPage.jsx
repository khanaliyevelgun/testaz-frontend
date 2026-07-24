"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchExamStatistics } from "@/lib/api";
import StaticText from "@/components/StaticText";
import AdminCardSkeleton from "@/components/admin/AdminCardSkeleton";


const StatBox = ({ label, value }) => (
  <div className='col-md-3'>
    <div className='border border-neutral-30 rounded-12 p-16 h-100'>
      <span className='text-13 text-neutral-400 d-block mb-4'>{label}</span>
      <strong className='text-18 text-neutral-500'>{value ?? "-"}</strong>
    </div>
  </div>
);

const AdminExamStatisticsPage = ({ examId }) => {
  const [statistics, setStatistics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError("");
    fetchExamStatistics(examId)
      .then((response) => {
        if (isMounted) setStatistics(response);
      })
      .catch((requestError) => {
        if (isMounted) setError(requestError?.message || "Statistika yüklənmədi.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [examId]);

  return (
    <div className='px-24 py-24'>
      <div className='bg-white rounded-10 px-24 py-24'>
        <div className='d-flex flex-wrap align-items-center justify-content-between gap-16 mb-24'>
          <div>
            <h4 className='fw-semibold text-neutral-500 text-20 mb-4'><StaticText text={"Exam Statistics"} /></h4>
            <p className='text-14 text-neutral-400 mb-0'>{examId}</p>
          </div>
          <div className='d-flex flex-wrap align-items-center gap-8'>
            <Link href={`/admin/exams/${examId}`} className='px-18 py-10 border border-neutral-40 rounded-pill text-14 text-neutral-500 bg-white'><StaticText text={"Details"} /></Link>
            <Link href={`/admin/exams/${examId}/attempts`} className='btn btn-main rounded-pill px-20'><StaticText text={"Attempts"} /></Link>
          </div>
        </div>

        {isLoading ? <AdminCardSkeleton rows={4} /> : null}
        {error ? <p className='text-danger mb-0'>{error}</p> : null}

        {statistics ? (
          <div className='row gy-3'>
            <StatBox label='Participants' value={statistics.participantCount} />
            <StatBox label='Attempts' value={statistics.attemptCount} />
            <StatBox label='Passed' value={statistics.passedCount} />
            <StatBox label='Max score' value={statistics.totalMaxScore} />
            <StatBox label='Average score' value={statistics.averageScore} />
            <StatBox label='Highest score' value={statistics.highestScore} />
            <StatBox label='Lowest score' value={statistics.lowestScore} />
            <StatBox label='Average percentage' value={statistics.averagePercentage != null ? `${statistics.averagePercentage}%` : "-"} />
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default AdminExamStatisticsPage;
