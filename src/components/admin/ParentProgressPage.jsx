"use client";

import { useCallback, useEffect, useState } from "react";
import AdminRefreshButton from "@/components/admin/AdminRefreshButton";
import AdminStatusBadge from "@/components/admin/AdminStatusBadge";
import {
  fetchChildResults,
  fetchChildSessionResult,
  fetchChildSessionResultDetails,
  fetchChildTopicTrends,
  fetchChildTrends,
  fetchParentDashboard,
} from "@/lib/api";
import { renderQuestionHtml } from "@/lib/questionContent";
import StaticText from "@/components/StaticText";
import StaticOption from "@/components/StaticOption";



const PAGE_SIZE = 10;

const formatDate = (value) => {
  if (!value) return "-";
  return new Intl.DateTimeFormat("az-AZ", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
};

const trendIcon = (trend) => {
  if (trend === "IMPROVING") return "ph-bold ph-trend-up text-success-600";
  if (trend === "DECLINING") return "ph-bold ph-trend-down text-danger";
  return "ph-bold ph-minus text-neutral-400";
};

const ParentProgressPage = () => {
  const [learners, setLearners] = useState([]);
  const [selectedLearnerId, setSelectedLearnerId] = useState("");
  const [results, setResults] = useState([]);
  const [subjectTrends, setSubjectTrends] = useState([]);
  const [topicTrends, setTopicTrends] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0, perPage: PAGE_SIZE });
  const [detail, setDetail] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadLearners = useCallback(async () => {
    const dashboard = await fetchParentDashboard();
    const nextLearners = dashboard?.learners || [];
    setLearners(nextLearners);
    setSelectedLearnerId((current) => current || nextLearners[0]?.learnerId || "");
    return nextLearners;
  }, []);

  const loadProgress = useCallback(async (learnerId, page = 1) => {
    if (!learnerId) {
      setResults([]);
      setSubjectTrends([]);
      setTopicTrends([]);
      setMeta({ page: 1, totalPages: 1, total: 0, perPage: PAGE_SIZE });
      return;
    }

    const [resultResponse, nextSubjectTrends, nextTopicTrends] = await Promise.all([
      fetchChildResults(learnerId, { page, perPage: PAGE_SIZE }),
      fetchChildTrends(learnerId),
      fetchChildTopicTrends(learnerId),
    ]);
    setResults(resultResponse.data || []);
    setMeta(resultResponse.meta || { page, totalPages: 1, total: 0, perPage: PAGE_SIZE });
    setSubjectTrends(nextSubjectTrends || []);
    setTopicTrends(nextTopicTrends || []);
  }, []);

  const load = useCallback(async ({ learnerId = selectedLearnerId, page = 1 } = {}) => {
    setIsLoading(true);
    setError("");
    try {
      let resolvedLearnerId = learnerId;
      if (!learners.length) {
        const nextLearners = await loadLearners();
        resolvedLearnerId = resolvedLearnerId || nextLearners[0]?.learnerId || "";
      }
      await loadProgress(resolvedLearnerId, page);
    } catch (requestError) {
      setError(requestError?.message || "Progress information could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }, [learners.length, loadLearners, loadProgress, selectedLearnerId]);

  useEffect(() => {
    load();
  }, []);

  const changeLearner = async (event) => {
    const learnerId = event.target.value;
    setSelectedLearnerId(learnerId);
    setResults([]);
    setSubjectTrends([]);
    setTopicTrends([]);
    setMeta({ page: 1, totalPages: 1, total: 0, perPage: PAGE_SIZE });
    setDetail(null);
    setIsLoading(true);
    setError("");
    try {
      await loadProgress(learnerId, 1);
    } catch (requestError) {
      setError(requestError?.message || "Learner progress could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  };

  const changePage = async (page) => {
    setIsLoading(true);
    setError("");
    try {
      await loadProgress(selectedLearnerId, page);
    } catch (requestError) {
      setError(requestError?.message || "Results could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  };

  const openDetail = async (sessionId) => {
    setDetail({ sessionId });
    setIsDetailLoading(true);
    setError("");
    try {
      const [result, details] = await Promise.all([
        fetchChildSessionResult(selectedLearnerId, sessionId),
        fetchChildSessionResultDetails(selectedLearnerId, sessionId),
      ]);
      setDetail({ ...result, details });
    } catch (requestError) {
      setDetail(null);
      setError(requestError?.message || "Result detail could not be loaded.");
    } finally {
      setIsDetailLoading(false);
    }
  };

  const selectedLearner = learners.find((item) => item.learnerId === selectedLearnerId);

  return (
    <div className='px-24 py-24'>
      <div className='bg-white rounded-10 px-24 py-24 mb-24'>
        <div className='d-flex flex-wrap align-items-center justify-content-between gap-16 mb-24'>
          <div>
            <h4 className='fw-semibold text-neutral-500 text-20 mb-4'><StaticText text={"Learner progress"} /></h4>
            <p className='text-14 text-neutral-400 mb-0'><StaticText text={"Results and cross-test trends for linked learners."} /></p>
          </div>
          <div className='d-flex flex-wrap align-items-center gap-10'>
            <select className='form-select rounded-pill border-neutral-40 text-14 py-11 px-16 min-w-220-px' value={selectedLearnerId} onChange={changeLearner}>
              {!learners.length ? <StaticOption value='' text={"No linked learners"} /> : null}
              {learners.map((learner) => <option value={learner.learnerId} key={learner.learnerId}>{learner.name || learner.learnerId}</option>)}
            </select>
            <AdminRefreshButton isLoading={isLoading} onClick={() => load({ learnerId: selectedLearnerId, page: meta.page })} />
          </div>
        </div>
        {error ? <div className='alert alert-danger text-14 py-10 mb-16'>{error}</div> : null}
        {selectedLearner ? (
          <div className='row gy-3'>
            <div className='col-md-4'><div className='border border-neutral-30 rounded-8 p-16'><span className='text-13 text-neutral-400 d-block'><StaticText text={"Learner"} /></span><strong className='text-17 text-neutral-500'>{selectedLearner.name || selectedLearner.learnerId}</strong></div></div>
            <div className='col-md-4'><div className='border border-neutral-30 rounded-8 p-16'><span className='text-13 text-neutral-400 d-block'><StaticText text={"Recent average"} /></span><strong className='text-17 text-neutral-500'>{selectedLearner.averagePercentage != null ? `${Math.round(selectedLearner.averagePercentage)}%` : "-"}</strong></div></div>
            <div className='col-md-4'><div className='border border-neutral-30 rounded-8 p-16'><span className='text-13 text-neutral-400 d-block'><StaticText text={"Recent results"} /></span><strong className='text-17 text-neutral-500'>{selectedLearner.recentResultCount || 0}</strong></div></div>
          </div>
        ) : <p className='text-14 text-neutral-400 mb-0'><StaticText text={"Link a learner from the Children page to see progress."} /></p>}
      </div>

      <div className='row gy-4 mb-24'>
        <div className='col-xl-6'>
          <div className='bg-white rounded-10 px-24 py-24 h-100'>
            <h5 className='text-16 fw-semibold text-neutral-500 mb-16'><StaticText text={"Subject trends"} /></h5>
            {isLoading ? <p className='text-14 text-neutral-400 mb-0'><StaticText text={"Loading..."} /></p> : subjectTrends.length ? (
              <div className='table-responsive'>
                <table className='table mb-0'>
                  <thead><tr><th className='text-12 py-12'><StaticText text={"Subject"} /></th><th className='text-12 py-12'><StaticText text={"Accuracy"} /></th><th className='text-12 py-12'><StaticText text={"Tests"} /></th><th className='text-12 py-12'><StaticText text={"Direction"} /></th></tr></thead>
                  <tbody>
                    {subjectTrends.map((item) => (
                      <tr key={item.subjectId}>
                        <td className='py-12 text-14 text-neutral-500'>{item.subjectName || `#${item.subjectId}`}</td>
                        <td className='py-12 text-14 text-neutral-500'>{Math.round(item.accuracy || 0)}%</td>
                        <td className='py-12 text-14 text-neutral-500'>{item.testsCount || 0}</td>
                        <td className='py-12 text-13 text-neutral-500'><i className={`${trendIcon(item.trend)} me-6`} />{item.trend || "-"}</td>
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
            <h5 className='text-16 fw-semibold text-neutral-500 mb-16'><StaticText text={"Topic trends"} /></h5>
            {isLoading ? <p className='text-14 text-neutral-400 mb-0'><StaticText text={"Loading..."} /></p> : topicTrends.length ? (
              <div className='table-responsive'>
                <table className='table mb-0'>
                  <thead><tr><th className='text-12 py-12'><StaticText text={"Topic"} /></th><th className='text-12 py-12'><StaticText text={"Accuracy"} /></th><th className='text-12 py-12'><StaticText text={"Questions"} /></th><th className='text-12 py-12'><StaticText text={"Direction"} /></th></tr></thead>
                  <tbody>
                    {topicTrends.slice(0, 10).map((item) => (
                      <tr key={item.topicId}>
                        <td className='py-12 text-14 text-neutral-500'>{item.topicName || `#${item.topicId}`}</td>
                        <td className='py-12 text-14 text-neutral-500'>{Math.round(item.accuracy || 0)}%</td>
                        <td className='py-12 text-14 text-neutral-500'>{item.totalQuestions || 0}</td>
                        <td className='py-12 text-13 text-neutral-500'><i className={`${trendIcon(item.trend)} me-6`} />{item.trend || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className='text-14 text-neutral-400 mb-0'><StaticText text={"No topic trend data yet."} /></p>}
          </div>
        </div>
      </div>

      <div className='bg-white rounded-10 px-24 py-24'>
        <h5 className='text-16 fw-semibold text-neutral-500 mb-16'><StaticText text={"Result history"} /></h5>
        <div className='table-responsive admin-users-table'>
          <table className='table mb-0'>
            <thead><tr><th className='text-12 py-14 px-16'><StaticText text={"Type"} /></th><th className='text-12 py-14 px-16'><StaticText text={"Score"} /></th><th className='text-12 py-14 px-16'><StaticText text={"Percentage"} /></th><th className='text-12 py-14 px-16'><StaticText text={"Correct"} /></th><th className='text-12 py-14 px-16'><StaticText text={"Scored"} /></th><th className='text-12 py-14 px-16 text-end'><StaticText text={"Action"} /></th></tr></thead>
            <tbody>
              {isLoading ? <tr><td className='py-20 px-16 text-neutral-400' colSpan='6'><StaticText text={"Loading..."} /></td></tr> : results.length ? results.map((result) => (
                <tr key={result.id || result.sessionId}>
                  <td className='py-14 px-16 text-14 text-neutral-500'>{result.type || "-"}</td>
                  <td className='py-14 px-16 text-14 text-neutral-500'>{result.totalScore ?? "-"} / {result.maxScore ?? "-"}</td>
                  <td className='py-14 px-16 text-14 text-neutral-500'>{result.percentage != null ? `${Math.round(result.percentage)}%` : "-"}</td>
                  <td className='py-14 px-16 text-14 text-neutral-500'>{result.correctCount ?? "-"} / {result.totalQuestions ?? "-"}</td>
                  <td className='py-14 px-16 text-14 text-neutral-500'>{formatDate(result.scoredAt)}</td>
                  <td className='py-14 px-16 text-end'><button type='button' className='px-14 py-8 border border-neutral-40 rounded-pill text-14 text-neutral-500 bg-white' onClick={() => openDetail(result.sessionId)}><StaticText text={"Details"} /></button></td>
                </tr>
              )) : <tr><td className='py-20 px-16 text-neutral-400' colSpan='6'><StaticText text={"No results found."} /></td></tr>}
            </tbody>
          </table>
        </div>
        <div className='d-flex align-items-center justify-content-end gap-8 mt-20'>
          <button type='button' className='px-14 py-8 border border-neutral-40 rounded-8 text-14 text-neutral-500' disabled={isLoading || meta.page <= 1} onClick={() => changePage(Math.max(meta.page - 1, 1))}><StaticText text={"Previous"} /></button>
          <span className='text-14 text-neutral-400'>{meta.page} / {meta.totalPages}</span>
          <button type='button' className='px-14 py-8 border border-neutral-40 rounded-8 text-14 text-neutral-500' disabled={isLoading || meta.page >= meta.totalPages} onClick={() => changePage(Math.min(meta.page + 1, meta.totalPages))}><StaticText text={"Next"} /></button>
        </div>
      </div>

      {detail ? (
        <div className='modal fade show d-block' tabIndex='-1' role='dialog' style={{ background: "rgba(15, 23, 42, 0.55)" }}>
          <div className='modal-dialog modal-dialog-scrollable modal-xl' role='document'>
            <div className='modal-content rounded-12 border-0'>
              <div className='modal-header border-neutral-30'>
                <h5 className='modal-title text-18 fw-semibold text-neutral-500'><StaticText text={"Learner result"} /></h5>
                <button type='button' className='btn-close' aria-label='Close' onClick={() => setDetail(null)} />
              </div>
              <div className='modal-body'>
                {isDetailLoading ? <p className='text-14 text-neutral-400 mb-0'><StaticText text={"Loading..."} /></p> : (
                  <>
                    <div className='row gy-3 mb-20'>
                      <div className='col-md-4'><div className='border border-neutral-30 rounded-8 p-14'><span className='text-12 text-neutral-400 d-block'><StaticText text={"Score"} /></span><strong>{detail.totalScore ?? "-"} / {detail.maxScore ?? "-"}</strong></div></div>
                      <div className='col-md-4'><div className='border border-neutral-30 rounded-8 p-14'><span className='text-12 text-neutral-400 d-block'><StaticText text={"Percentage"} /></span><strong>{detail.percentage != null ? `${Math.round(detail.percentage)}%` : "-"}</strong></div></div>
                      <div className='col-md-4'><div className='border border-neutral-30 rounded-8 p-14'><span className='text-12 text-neutral-400 d-block'><StaticText text={"Correct / wrong / blank"} /></span><strong>{detail.correctCount || 0} / {detail.wrongCount || 0} / {detail.blankCount || 0}</strong></div></div>
                    </div>
                    <div className='d-flex flex-column gap-12'>
                      {(detail.details || []).map((item, index) => (
                        <div className='border border-neutral-30 rounded-10 p-16' key={`${item.questionId}-${index}`}>
                          <div className='d-flex align-items-center gap-8 mb-10'><strong className='text-14 text-neutral-500'><StaticText text={"Question"} /> {index + 1}</strong><AdminStatusBadge status={item.correct ? "ACTIVE" : item.blank ? "PENDING" : "REJECTED"} label={item.correct ? "Correct" : item.blank ? "Blank" : "Wrong"} /></div>
                          <div className='text-14 text-neutral-500 mb-10' dangerouslySetInnerHTML={renderQuestionHtml(item.stem || "")} />
                          <span className='text-13 text-neutral-400'><StaticText text={"Learner answer:"} /> {item.studentAnswer || "-"} <StaticText text={"· Correct:"} /> {item.correctAnswer || "-"}</span>
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
    </div>
  );
};

export default ParentProgressPage;
