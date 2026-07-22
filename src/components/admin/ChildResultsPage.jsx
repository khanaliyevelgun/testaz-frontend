"use client";

import { useEffect, useState } from "react";
import AdminRefreshButton from "@/components/admin/AdminRefreshButton";
import AdminStatusBadge, { TREND_LABELS } from "@/components/admin/AdminStatusBadge";
import AdminPagination from "@/components/admin/AdminPagination";
import {
  fetchResultTopicTrends,
  fetchResultTrends,
  fetchResults,
  fetchSessionResult,
  fetchSessionResultDetails,
  reportQuestion,
} from "@/lib/api";
import { formatDateTime as formatDate } from "@/lib/format";
import { renderQuestionHtml } from "@/lib/questionContent";
import StaticText from "@/components/StaticText";
import StaticOption from "@/components/StaticOption";



const ChildResultsPage = () => {
  const [results, setResults] = useState([]);
  const [meta, setMeta] = useState({ page: 1, perPage: 10, total: 0, totalPages: 1 });
  const [subjectTrends, setSubjectTrends] = useState([]);
  const [topicTrends, setTopicTrends] = useState([]);
  const [detail, setDetail] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [reportForm, setReportForm] = useState(null);
  const [isReporting, setIsReporting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const load = async (page = 1) => {
    setIsLoading(true);
    setError("");
    try {
      const [response, nextSubjectTrends, nextTopicTrends] = await Promise.all([
        fetchResults({ page, perPage: 10 }),
        fetchResultTrends(),
        fetchResultTopicTrends(),
      ]);
      setResults(response.data || []);
      setMeta(response.meta || { page, perPage: 10, total: 0, totalPages: 1 });
      setSubjectTrends(nextSubjectTrends || []);
      setTopicTrends(nextTopicTrends || []);
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

  const openDetail = async (sessionId) => {
    setIsDetailLoading(true);
    setDetail({ sessionId });
    setReportForm(null);
    setError("");
    try {
      const [result, details] = await Promise.all([
        fetchSessionResult(sessionId),
        fetchSessionResultDetails(sessionId),
      ]);
      setDetail({ ...result, details });
    } catch (requestError) {
      setDetail(null);
      setError(requestError?.message || "Result details could not be loaded.");
    } finally {
      setIsDetailLoading(false);
    }
  };

  const submitReport = async (event) => {
    event.preventDefault();
    if (!reportForm?.questionId) return;

    setIsReporting(true);
    setError("");
    setNotice("");
    try {
      await reportQuestion(reportForm.questionId, {
        reason: reportForm.reason,
        comment: reportForm.comment.trim() || undefined,
        sessionId: detail?.sessionId,
      });
      setNotice("Question report sent to the review team.");
      setReportForm(null);
    } catch (requestError) {
      setError(requestError?.message || "Question report could not be sent.");
    } finally {
      setIsReporting(false);
    }
  };

  const trendIcon = (trend) => {
    if (trend === "IMPROVING") return "ph-bold ph-trend-up text-success-600";
    if (trend === "DECLINING") return "ph-bold ph-trend-down text-danger";
    return "ph-bold ph-minus text-neutral-400";
  };

  return (
    <div className='px-24 py-24'>
      <div className='bg-white rounded-10 px-24 py-24'>
        <div className='d-flex flex-wrap align-items-center justify-content-between gap-16 mb-24'>
          <div>
            <h4 className='fw-semibold text-neutral-500 text-20 mb-4'><StaticText text={"Quiz Attempts"} /></h4>
            <p className='text-14 text-neutral-400 mb-0'><StaticText text={"Submitted exam and practice results."} /></p>
          </div>
          <AdminRefreshButton isLoading={isLoading} onClick={() => load(meta.page)} />
        </div>

        {notice ? <div className='alert alert-success text-14 py-10 mb-16'>{notice}</div> : null}
        {error ? <div className='alert alert-danger text-14 py-10 mb-16'>{error}</div> : null}

        <div className='table-responsive admin-users-table'>
          <table className='table mb-0'>
            <thead>
              <tr>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'><StaticText text={"Type"} /></th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'><StaticText text={"Score"} /></th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'><StaticText text={"Percentage"} /></th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'><StaticText text={"Correct"} /></th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'><StaticText text={"Scored"} /></th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20 text-end'><StaticText text={"Action"} /></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td className='py-20 px-20 text-neutral-400' colSpan='6'><StaticText text={"Loading..."} /></td></tr>
              ) : results.length ? (
                results.map((result) => (
                  <tr key={result.id || result.sessionId}>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{result.type || "-"}</td>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{result.totalScore ?? "-"} / {result.maxScore ?? "-"}</td>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{result.percentage != null ? `${Math.round(result.percentage)}%` : "-"}</td>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{result.correctCount ?? "-"} / {result.totalQuestions ?? "-"}</td>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{formatDate(result.scoredAt)}</td>
                    <td className='py-16 px-20 text-end'>
                      <button type='button' className='px-14 py-8 border border-neutral-40 rounded-pill text-14 text-neutral-500 bg-white' onClick={() => openDetail(result.sessionId)}>
                        <StaticText text={"Details"} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td className='py-20 px-20 text-neutral-400' colSpan='6'><StaticText text={"No results found."} /></td></tr>
              )}
            </tbody>
          </table>
        </div>

        <AdminPagination meta={meta} onPageChange={load} />
      </div>

      <div className='row gy-4 mt-1'>
        <div className='col-xl-6'>
          <div className='bg-white rounded-10 px-24 py-24 h-100'>
            <h5 className='text-16 fw-semibold text-neutral-500 mb-4'><StaticText text={"Subject progress"} /></h5>
            <p className='text-13 text-neutral-400 mb-20'><StaticText text={"Cumulative performance across submitted tests."} /></p>
            {isLoading ? <p className='text-14 text-neutral-400 mb-0'><StaticText text={"Loading..."} /></p> : subjectTrends.length ? (
              <div className='table-responsive'>
                <table className='table mb-0'>
                  <thead><tr><th className='text-12 py-12'><StaticText text={"Subject"} /></th><th className='text-12 py-12'><StaticText text={"Accuracy"} /></th><th className='text-12 py-12'><StaticText text={"Tests"} /></th><th className='text-12 py-12'><StaticText text={"Trend"} /></th></tr></thead>
                  <tbody>
                    {subjectTrends.map((item) => (
                      <tr key={item.subjectId}>
                        <td className='py-12 text-14 text-neutral-500'>{item.subjectName || `#${item.subjectId}`}</td>
                        <td className='py-12 text-14 text-neutral-500'>{Math.round(item.accuracy || 0)}%</td>
                        <td className='py-12 text-14 text-neutral-500'>{item.testsCount || 0}</td>
                        <td className='py-12 text-14 text-neutral-500'><i className={`${trendIcon(item.trend)} me-6`} />{TREND_LABELS[item.trend] ? <StaticText text={TREND_LABELS[item.trend]} /> : item.trend || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className='text-14 text-neutral-400 mb-0'><StaticText text={"No subject trend data yet."} /></p>}
          </div>
        </div>
        <div className='col-xl-6'>
          <div className='bg-white rounded-10 px-24 py-24 h-100'>
            <h5 className='text-16 fw-semibold text-neutral-500 mb-4'><StaticText text={"Topics to improve"} /></h5>
            <p className='text-13 text-neutral-400 mb-20'><StaticText text={"Weakest topics are returned first."} /></p>
            {isLoading ? <p className='text-14 text-neutral-400 mb-0'><StaticText text={"Loading..."} /></p> : topicTrends.length ? (
              <div className='table-responsive'>
                <table className='table mb-0'>
                  <thead><tr><th className='text-12 py-12'><StaticText text={"Topic"} /></th><th className='text-12 py-12'><StaticText text={"Accuracy"} /></th><th className='text-12 py-12'><StaticText text={"Questions"} /></th><th className='text-12 py-12'><StaticText text={"Trend"} /></th></tr></thead>
                  <tbody>
                    {topicTrends.slice(0, 10).map((item) => (
                      <tr key={item.topicId}>
                        <td className='py-12 text-14 text-neutral-500'>{item.topicName || `#${item.topicId}`}</td>
                        <td className='py-12 text-14 text-neutral-500'>{Math.round(item.accuracy || 0)}%</td>
                        <td className='py-12 text-14 text-neutral-500'>{item.totalQuestions || 0}</td>
                        <td className='py-12 text-14 text-neutral-500'><i className={`${trendIcon(item.trend)} me-6`} />{TREND_LABELS[item.trend] ? <StaticText text={TREND_LABELS[item.trend]} /> : item.trend || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className='text-14 text-neutral-400 mb-0'><StaticText text={"No topic trend data yet."} /></p>}
          </div>
        </div>
      </div>

      {detail ? (
        <div className='modal fade show d-block' tabIndex='-1' role='dialog' style={{ background: "rgba(15, 23, 42, 0.55)" }}>
          <div className='modal-dialog modal-dialog-scrollable modal-xl' role='document'>
            <div className='modal-content rounded-12 border-0'>
              <div className='modal-header border-neutral-30'>
                <div>
                  <h5 className='modal-title text-18 fw-semibold text-neutral-500'><StaticText text={"Result details"} /></h5>
                  {!isDetailLoading ? <span className='text-13 text-neutral-400'>{detail.sessionId}</span> : null}
                </div>
                <button type='button' className='btn-close' aria-label='Close' onClick={() => { setDetail(null); setReportForm(null); }} />
              </div>
              <div className='modal-body'>
                {isDetailLoading ? <p className='text-14 text-neutral-400 mb-0'><StaticText text={"Loading..."} /></p> : (
                  <>
                    <div className='row gy-3 mb-24'>
                      <div className='col-md-3'><div className='border border-neutral-30 rounded-8 p-14'><span className='text-12 text-neutral-400 d-block'><StaticText text={"Score"} /></span><strong>{detail.totalScore ?? "-"} / {detail.maxScore ?? "-"}</strong></div></div>
                      <div className='col-md-3'><div className='border border-neutral-30 rounded-8 p-14'><span className='text-12 text-neutral-400 d-block'><StaticText text={"Percentage"} /></span><strong>{detail.percentage != null ? `${Math.round(detail.percentage)}%` : "-"}</strong></div></div>
                      <div className='col-md-3'><div className='border border-neutral-30 rounded-8 p-14'><span className='text-12 text-neutral-400 d-block'><StaticText text={"Correct / wrong / blank"} /></span><strong>{detail.correctCount ?? 0} / {detail.wrongCount ?? 0} / {detail.blankCount ?? 0}</strong></div></div>
                      <div className='col-md-3'><div className='border border-neutral-30 rounded-8 p-14'><span className='text-12 text-neutral-400 d-block'><StaticText text={"Scoring"} /></span><strong>{detail.scoringMode || "-"}</strong></div></div>
                    </div>

                    <div className='d-flex flex-column gap-12'>
                      {(detail.details || []).map((item, index) => (
                        <div className='border border-neutral-30 rounded-10 p-16' key={`${item.questionId}-${index}`}>
                          <div className='d-flex flex-wrap align-items-center justify-content-between gap-10 mb-12'>
                            <div className='d-flex align-items-center gap-8'>
                              <strong className='text-14 text-neutral-500'><StaticText text={"Question"} /> {index + 1}</strong>
                              <AdminStatusBadge status={item.correct ? "ACTIVE" : item.blank ? "PENDING" : "REJECTED"} label={item.correct ? "Correct" : item.blank ? "Blank" : "Wrong"} />
                            </div>
                            <button type='button' className='px-12 py-7 border border-neutral-40 rounded-pill text-13 text-neutral-500 bg-white' onClick={() => setReportForm({ questionId: item.questionId, reason: "WRONG_ANSWER", comment: "" })}>
                              <StaticText text={"Report question"} />
                            </button>
                          </div>
                          <div className='text-14 text-neutral-500 mb-12' dangerouslySetInnerHTML={renderQuestionHtml(item.stem || "")} />
                          <div className='row gy-2'>
                            <div className='col-md-6'><span className='text-12 text-neutral-400 d-block'><StaticText text={"Your answer"} /></span><span className='text-14 text-neutral-500'>{item.studentAnswer || "-"}</span></div>
                            <div className='col-md-6'><span className='text-12 text-neutral-400 d-block'><StaticText text={"Correct answer"} /></span><span className='text-14 text-neutral-500'>{item.correctAnswer || "-"}</span></div>
                          </div>
                          {item.explanation ? <p className='text-13 text-neutral-400 mt-12 mb-0'>{item.explanation}</p> : null}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {reportForm ? (
        <div className='modal fade show d-block' tabIndex='-1' role='dialog' style={{ background: "rgba(15, 23, 42, 0.62)" }}>
          <div className='modal-dialog modal-dialog-centered' role='document'>
            <form className='modal-content rounded-12 border-0' onSubmit={submitReport}>
              <div className='modal-header border-neutral-30'>
                <h5 className='modal-title text-18 fw-semibold text-neutral-500'><StaticText text={"Report question"} /></h5>
                <button type='button' className='btn-close' aria-label='Close' onClick={() => setReportForm(null)} />
              </div>
              <div className='modal-body'>
                <label className='text-14 text-neutral-500 fw-medium mb-8'><StaticText text={"Reason"} /></label>
                <select className='form-select rounded-pill border-neutral-40 text-14 py-11 px-16 mb-16' value={reportForm.reason} onChange={(event) => setReportForm((current) => ({ ...current, reason: event.target.value }))}>
                  <StaticOption value='WRONG_ANSWER' text={"Wrong answer"} />
                  <StaticOption value='TYPO' text={"Typo"} />
                  <StaticOption value='UNCLEAR' text={"Unclear"} />
                  <StaticOption value='OTHER' text={"Other"} />
                </select>
                <label className='text-14 text-neutral-500 fw-medium mb-8'><StaticText text={"Comment"} /></label>
                <textarea className='common-input rounded-8' rows='4' maxLength='2000' value={reportForm.comment} onChange={(event) => setReportForm((current) => ({ ...current, comment: event.target.value }))} />
              </div>
              <div className='modal-footer border-neutral-30'>
                <button type='button' className='px-18 py-10 border border-neutral-40 rounded-pill text-14 text-neutral-500 bg-white' onClick={() => setReportForm(null)}><StaticText text={"Cancel"} /></button>
                <button type='submit' className='btn btn-main rounded-pill px-20' disabled={isReporting}>{isReporting ? <StaticText text={"Sending..."} /> : <StaticText text={"Send report"} />}</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ChildResultsPage;
