"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { fetchSessionResult, fetchSessionResultDetails } from "@/lib/api";
import { renderQuestionHtml } from "@/lib/questionContent";
import StaticText from "@/components/StaticText";


const formatType = (value) => String(value || "-").replaceAll("_", " ");

const formatDuration = (seconds) => {
  if (seconds == null) return "-";
  const totalSeconds = Math.max(Number(seconds) || 0, 0);
  const minutes = Math.floor(totalSeconds / 60);
  return `${minutes} min`;
};

const SessionResultPage = ({ sessionId }) => {
  const retryTimerRef = useRef(null);
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isScoring, setIsScoring] = useState(false);
  const [error, setError] = useState("");

  const loadResult = useCallback(async () => {
    setError("");

    try {
      const response = await fetchSessionResult(sessionId);
      const details = await fetchSessionResultDetails(sessionId);
      setResult({ ...response, details });
      setIsScoring(false);
      setIsLoading(false);
    } catch (requestError) {
      if (requestError?.status === 409) {
        setIsScoring(true);
        setIsLoading(false);
        retryTimerRef.current = window.setTimeout(loadResult, 2500);
        return;
      }

      setError(requestError?.message || "Nəticə yüklənə bilmədi.");
      setIsScoring(false);
      setIsLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    loadResult();

    return () => {
      if (retryTimerRef.current) window.clearTimeout(retryTimerRef.current);
    };
  }, [loadResult]);

  if (isLoading) {
    return (
      <div className='px-24 py-48'>
        <div className='container'>
          <div className='bg-white rounded-10 px-24 py-24 text-neutral-400'><StaticText text={"Nəticə yüklənir..."} /></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='px-24 py-48'>
        <div className='container'>
          <div className='bg-white rounded-10 px-24 py-24'>
            <div className='alert alert-danger text-14 mb-20'>{error}</div>
            <Link href='/admin/quiz-attempts' className='btn btn-main rounded-pill px-20'>
              <StaticText text={"Nəticələrə qayıt"} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isScoring || !result) {
    return (
      <div className='px-24 py-48'>
        <div className='container'>
          <div className='bg-white rounded-10 px-24 py-24'>
            <h4 className='fw-semibold text-neutral-500 text-20 mb-8'><StaticText text={"Nəticəniz hazırlanır"} /></h4>
            <p className='text-14 text-neutral-400 mb-0'><StaticText text={"Nəticə hesablanır. Səhifə avtomatik yenilənəcək."} /></p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='px-24 py-48'>
      <div className='container'>
        <div className='d-flex flex-wrap align-items-center justify-content-between gap-16 mb-24'>
          <div>
            <h4 className='fw-semibold text-neutral-500 text-24 mb-4'><StaticText text={"Nəticəniz hazırdır"} /></h4>
            <p className='text-14 text-neutral-400 mb-0'><StaticText text={"Session:"} /> {result.sessionId || sessionId}</p>
          </div>
          <Link href='/admin/quiz-attempts' className='px-18 py-10 border border-neutral-40 rounded-pill text-14 text-neutral-500 bg-white'>
            <StaticText text={"Nəticələrə qayıt"} />
          </Link>
        </div>

        <div className='row gy-3 mb-24'>
          <div className='col-md-3'><div className='bg-white border border-neutral-30 rounded-10 p-20 h-100'><span className='text-13 text-neutral-400 d-block mb-4'><StaticText text={"Bal"} /></span><strong className='text-20 text-neutral-500'>{result.totalScore ?? "-"} / {result.maxScore ?? "-"}</strong></div></div>
          <div className='col-md-3'><div className='bg-white border border-neutral-30 rounded-10 p-20 h-100'><span className='text-13 text-neutral-400 d-block mb-4'><StaticText text={"Faiz"} /></span><strong className='text-20 text-neutral-500'>{result.percentage != null ? `${Math.round(result.percentage)}%` : "-"}</strong></div></div>
          <div className='col-md-3'><div className='bg-white border border-neutral-30 rounded-10 p-20 h-100'><span className='text-13 text-neutral-400 d-block mb-4'><StaticText text={"Düzgün cavab"} /></span><strong className='text-20 text-neutral-500'>{result.correctCount ?? 0} / {result.totalQuestions ?? "-"}</strong></div></div>
          <div className='col-md-3'><div className='bg-white border border-neutral-30 rounded-10 p-20 h-100'><span className='text-13 text-neutral-400 d-block mb-4'><StaticText text={"Müddət"} /></span><strong className='text-20 text-neutral-500'>{formatDuration(result.durationSeconds)}</strong></div></div>
        </div>

        <div className='bg-white rounded-10 px-24 py-24'>
          <div className='d-flex flex-wrap align-items-center justify-content-between gap-12 mb-20'>
            <div>
              <h5 className='text-18 fw-semibold text-neutral-500 mb-4'><StaticText text={"Sual nəticələri"} /></h5>
              <p className='text-13 text-neutral-400 mb-0'>{formatType(result.type)} · {formatType(result.scoringMode)}</p>
            </div>
            {result.passed != null ? <span className='px-12 py-6 rounded-pill bg-main-25 text-main-600 text-13'>{result.passed ? <StaticText text={"Keçdi"} /> : <StaticText text={"Keçə bilmədi"} />}</span> : null}
          </div>

          <div className='d-flex flex-column gap-12'>
            {(result.details || []).map((item, index) => (
              <div className='border border-neutral-30 rounded-10 p-16' key={`${item.questionId || "question"}-${index}`}>
                <div className='d-flex flex-wrap align-items-center justify-content-between gap-10 mb-12'>
                  <strong className='text-14 text-neutral-500'><StaticText text={"Sual"} /> {index + 1}</strong>
                  <span className={`px-10 py-4 rounded-pill text-12 ${item.correct ? "bg-success-100 text-success-600" : item.blank ? "bg-warning-100 text-warning-600" : "bg-danger-100 text-danger-600"}`}>
                    {item.correct ? <StaticText text={"Düzgün"} /> : item.blank ? <StaticText text={"Boş"} /> : <StaticText text={"Səhv"} />}
                  </span>
                </div>
                <div className='text-14 text-neutral-500 mb-12' dangerouslySetInnerHTML={renderQuestionHtml(item.stem || "")} />
                <div className='row gy-2'>
                  <div className='col-md-6'><span className='text-12 text-neutral-400 d-block'><StaticText text={"Sizin cavabınız"} /></span><span className='text-14 text-neutral-500'>{item.studentAnswer || "-"}</span></div>
                  <div className='col-md-6'><span className='text-12 text-neutral-400 d-block'><StaticText text={"Düzgün cavab"} /></span><span className='text-14 text-neutral-500'>{item.correctAnswer || "-"}</span></div>
                </div>
                {item.explanation ? <p className='text-13 text-neutral-400 mt-12 mb-0'>{item.explanation}</p> : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionResultPage;
