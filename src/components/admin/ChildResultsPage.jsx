"use client";

import { useEffect, useState } from "react";
import AdminRefreshButton from "@/components/admin/AdminRefreshButton";
import { fetchResults } from "@/lib/api";

const formatDate = (value) => {
  if (!value) return "-";
  return new Intl.DateTimeFormat("az-AZ", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
};

const ChildResultsPage = () => {
  const [results, setResults] = useState([]);
  const [meta, setMeta] = useState({ page: 1, perPage: 10, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async (page = 1) => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetchResults({ page, perPage: 10 });
      setResults(response.data || []);
      setMeta(response.meta || { page, perPage: 10, total: 0, totalPages: 1 });
    } catch (requestError) {
      setError(requestError?.message || "Results could not be loaded.");
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load(1);
  }, []);

  return (
    <div className='px-24 py-24'>
      <div className='bg-white rounded-10 px-24 py-24'>
        <div className='d-flex flex-wrap align-items-center justify-content-between gap-16 mb-24'>
          <div>
            <h4 className='fw-semibold text-neutral-500 text-20 mb-4'>Quiz Attempts</h4>
            <p className='text-14 text-neutral-400 mb-0'>Submitted exam and practice results.</p>
          </div>
          <AdminRefreshButton isLoading={isLoading} onClick={() => load(meta.page)} />
        </div>

        {error ? <div className='alert alert-danger text-14 py-10 mb-16'>{error}</div> : null}

        <div className='table-responsive admin-users-table'>
          <table className='table mb-0'>
            <thead>
              <tr>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Type</th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Score</th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Percentage</th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Correct</th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Scored</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td className='py-20 px-20 text-neutral-400' colSpan='5'>Loading...</td></tr>
              ) : results.length ? (
                results.map((result) => (
                  <tr key={result.id || result.sessionId}>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{result.type || "-"}</td>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{result.totalScore ?? "-"} / {result.maxScore ?? "-"}</td>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{result.percentage != null ? `${Math.round(result.percentage)}%` : "-"}</td>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{result.correctCount ?? "-"} / {result.totalQuestions ?? "-"}</td>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{formatDate(result.scoredAt)}</td>
                  </tr>
                ))
              ) : (
                <tr><td className='py-20 px-20 text-neutral-400' colSpan='5'>No results found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className='d-flex align-items-center justify-content-end gap-8 mt-24'>
          <button type='button' className='px-14 py-8 border border-neutral-40 rounded-8 text-14 text-neutral-500' disabled={meta.page <= 1} onClick={() => load(Math.max(meta.page - 1, 1))}>Previous</button>
          <span className='text-14 text-neutral-400'>{meta.page} / {meta.totalPages}</span>
          <button type='button' className='px-14 py-8 border border-neutral-40 rounded-8 text-14 text-neutral-500' disabled={meta.page >= meta.totalPages} onClick={() => load(Math.min(meta.page + 1, meta.totalPages))}>Next</button>
        </div>
      </div>
    </div>
  );
};

export default ChildResultsPage;
