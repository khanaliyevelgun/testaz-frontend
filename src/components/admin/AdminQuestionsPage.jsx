"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import AdminGradeSelect from "@/components/admin/AdminGradeSelect";
import AdminRefreshButton from "@/components/admin/AdminRefreshButton";
import AdminRowActions from "@/components/admin/AdminRowActions";
import AdminSearchSelect from "@/components/admin/AdminSearchSelect";
import AdminStatusBadge from "@/components/admin/AdminStatusBadge";
import { approveAllAdminQuestions, archiveAdminQuestion, fetchAdminQuestions, fetchSubjects, fetchTopics, rejectAdminQuestion } from "@/lib/api";
import { questionHtmlToText } from "@/lib/questionContent";

const statuses = ["DRAFT", "PENDING_REVIEW", "ACTIVE", "REJECTED", "ARCHIVED"];
const difficulties = ["EASY", "MEDIUM", "HARD"];
const types = ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "SHORT_TEXT"];

const AdminQuestionsPage = () => {
  const [questions, setQuestions] = useState([]);
  const [meta, setMeta] = useState({ page: 1, perPage: 10, total: 0, totalPages: 1 });
  const [filters, setFilters] = useState({ search: "", subjectCode: "", topicCode: "", gradeId: "", difficulty: "", type: "", status: "" });
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [subjectLabel, setSubjectLabel] = useState("");
  const [topicLabel, setTopicLabel] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isApprovingAll, setIsApprovingAll] = useState(false);
  const [error, setError] = useState("");

  const loadQuestions = async ({ page = 1 } = {}) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetchAdminQuestions({ page, perPage: 10, ...filters });
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
  }, [filters]);

  const setFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }));

  const subjectOptions = useCallback((search) =>
    fetchSubjects({ page: 1, perPage: 20, search, active: "true" }).then((response) =>
      (response.data || []).map((subject) => ({
        value: subject.code,
        label: `${subject.name || subject.code} (${subject.code})`,
        subjectId: subject.id,
      }))
    ), []);

  const topicOptions = useCallback((search) => {
    if (!selectedSubjectId) return Promise.resolve([]);
    return fetchTopics(selectedSubjectId, { page: 1, perPage: 20, search, gradeId: filters.gradeId, active: "true" }).then((response) =>
      (response.data || []).map((topic) => ({
        value: topic.code,
        label: `${topic.name || topic.code}${topic.code ? ` (${topic.code})` : ""}`,
      }))
    );
  }, [filters.gradeId, selectedSubjectId]);

  const setSubjectFilter = (value, label, option) => {
    setFilters((current) => ({ ...current, subjectCode: value, topicCode: "" }));
    setSelectedSubjectId(option?.subjectId ? String(option.subjectId) : "");
    setSubjectLabel(label);
    setTopicLabel("");
  };

  const setGradeFilter = (value) => {
    setFilters((current) => ({ ...current, gradeId: value, topicCode: "" }));
    setTopicLabel("");
  };

  const setTopicFilter = (value, label) => {
    setFilters((current) => ({ ...current, topicCode: value }));
    setTopicLabel(label);
  };

  const runAction = async (question, action) => {
    try {
      await action(question.id);
      await loadQuestions({ page: meta.page });
    } catch {
      setError("Question action failed.");
    }
  };

  const handleApproveAll = async () => {
    const confirmed = window.confirm("Approve all pending review questions?");
    if (!confirmed) return;

    setIsApprovingAll(true);
    setError("");
    try {
      const count = await approveAllAdminQuestions();
      await loadQuestions({ page: 1 });
      window.alert(`${count} questions approved.`);
    } catch {
      setError("Bulk approve failed.");
    } finally {
      setIsApprovingAll(false);
    }
  };

  const actionsFor = (question) => [
    { label: "Edit", href: `/admin/questions/${question.id}/edit`, icon: "ph ph-pencil-simple" },
    { label: "Reject", icon: "ph ph-x", danger: true, onClick: () => runAction(question, rejectAdminQuestion) },
    { label: "Archive", icon: "ph ph-archive", onClick: () => runAction(question, archiveAdminQuestion) },
  ];

  return (
    <div className='px-24 py-24'>
      <div className='bg-white rounded-10 px-24 py-24'>
        <div className='d-flex flex-wrap align-items-center justify-content-between gap-16 mb-24'>
          <div>
            <h4 className='fw-semibold text-neutral-500 text-20 mb-4'>Questions</h4>
            <p className='text-14 text-neutral-400 mb-0'>Question bank review and moderation.</p>
          </div>
          <div className='d-flex flex-wrap align-items-center gap-8'>
            <Link href='/admin/questions/new' className='btn btn-main rounded-pill px-20'>Create Question</Link>
            <button type='button' className='btn btn-main rounded-pill px-20' disabled={isApprovingAll} onClick={handleApproveAll}>
              {isApprovingAll ? "Approving..." : "Approve all"}
            </button>
            <AdminRefreshButton isLoading={isLoading} onClick={() => loadQuestions({ page: meta.page })} />
          </div>
        </div>

        <div className='d-flex flex-wrap align-items-center gap-12 mb-24'>
          <input className='common-input rounded-pill flex-grow-1 min-w-220-px' placeholder='Search question text...' value={filters.search} onChange={(event) => setFilter("search", event.target.value)} />
          <AdminSearchSelect
            value={filters.subjectCode}
            selectedLabel={subjectLabel}
            placeholder='Search subjects...'
            loadOptions={subjectOptions}
            onChange={setSubjectFilter}
            minWidthClass='min-w-220-px'
          />
          <AdminSearchSelect
            value={filters.topicCode}
            selectedLabel={topicLabel}
            placeholder={selectedSubjectId ? "Search topics..." : "Select subject first"}
            disabled={!selectedSubjectId}
            loadOptions={topicOptions}
            onChange={setTopicFilter}
            minWidthClass='min-w-220-px'
          />
          <AdminGradeSelect value={filters.gradeId} onChange={setGradeFilter} minWidthClass='min-w-140-px' />
          <select className='form-select rounded-pill border-neutral-40 text-14 py-11 px-16 w-auto min-w-160-px' value={filters.difficulty} onChange={(event) => setFilter("difficulty", event.target.value)}>
            <option value=''>Difficulty</option>
            {difficulties.map((item) => <option value={item} key={item}>{item}</option>)}
          </select>
          <select className='form-select rounded-pill border-neutral-40 text-14 py-11 px-16 w-auto min-w-190-px' value={filters.type} onChange={(event) => setFilter("type", event.target.value)}>
            <option value=''>Type</option>
            {types.map((item) => <option value={item} key={item}>{item.replaceAll("_", " ")}</option>)}
          </select>
          <select className='form-select rounded-pill border-neutral-40 text-14 py-11 px-16 w-auto min-w-180-px' value={filters.status} onChange={(event) => setFilter("status", event.target.value)}>
            <option value=''>Status</option>
            {statuses.map((item) => <option value={item} key={item}>{item.replaceAll("_", " ")}</option>)}
          </select>
        </div>

        {error ? <p className='text-danger mb-16'>{error}</p> : null}

        <div className='table-responsive admin-users-table'>
          <table className='table mb-0'>
            <thead>
              <tr>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Question</th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Subject</th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Topic</th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Type</th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Status</th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20 text-end'>Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td className='py-20 px-20 text-neutral-400' colSpan='6'>Loading...</td></tr>
              ) : questions.length ? (
                questions.map((question) => (
                  <tr key={question.id}>
                    <td className='py-16 px-20 text-14 text-neutral-500'>
                      <span>{questionHtmlToText(question.stem) || question.id}</span>
                      {question.mediaPath ? <span className='ms-8 text-12 text-main-600'>image</span> : null}
                    </td>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{question.subjectId || "-"}</td>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{question.topicId || "-"}</td>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{question.type || "-"}</td>
                    <td className='py-16 px-20'><AdminStatusBadge status={question.status} /></td>
                    <td className='py-16 px-20'><div className='d-flex justify-content-end'><AdminRowActions items={actionsFor(question)} /></div></td>
                  </tr>
                ))
              ) : (
                <tr><td className='py-20 px-20 text-neutral-400' colSpan='6'>No questions found.</td></tr>
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
