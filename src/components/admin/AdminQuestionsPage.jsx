"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import AdminGradeSelect from "@/components/admin/AdminGradeSelect";
import AdminRefreshButton from "@/components/admin/AdminRefreshButton";
import AdminRowActions from "@/components/admin/AdminRowActions";
import AdminSearchSelect from "@/components/admin/AdminSearchSelect";
import AdminStatusBadge from "@/components/admin/AdminStatusBadge";
import { approveAdminQuestion, approveAllAdminQuestions, archiveAdminQuestion, fetchAdminQuestions, fetchSubjects, fetchTopics, rejectAdminQuestion } from "@/lib/api";
import { questionHtmlToText } from "@/lib/questionContent";

const statuses = ["DRAFT", "PENDING_REVIEW", "ACTIVE", "REJECTED", "ARCHIVED"];
const difficulties = ["EASY", "MEDIUM", "HARD"];
const types = ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "SHORT_TEXT"];
const statusLabels = {
  DRAFT: "Qaralama",
  PENDING_REVIEW: "Baxış gözləyir",
  ACTIVE: "Aktiv",
  REJECTED: "Rədd edilib",
  ARCHIVED: "Arxivdə",
};
const difficultyLabels = {
  EASY: "Asan",
  MEDIUM: "Orta",
  HARD: "Çətin",
};
const typeLabels = {
  SINGLE_CHOICE: "Tək seçim",
  MULTIPLE_CHOICE: "Çox seçim",
  SHORT_TEXT: "Qısa cavab",
};
const approvableStatuses = new Set(["DRAFT", "PENDING_REVIEW"]);

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
      setError("Suallar yüklənmədi.");
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
      setError("Sual üzərində əməliyyat alınmadı.");
    }
  };

  const handleApproveAll = async () => {
    const confirmed = window.confirm("Baxış gözləyən bütün suallar təsdiqlənsin?");
    if (!confirmed) return;

    setIsApprovingAll(true);
    setError("");
    try {
      const count = await approveAllAdminQuestions();
      await loadQuestions({ page: 1 });
      window.alert(`${count} sual təsdiqləndi.`);
    } catch {
      setError("Kütləvi təsdiqləmə alınmadı.");
    } finally {
      setIsApprovingAll(false);
    }
  };

  const actionsFor = (question) => {
    const items = [
      { label: "Redaktə et", href: `/admin/questions/${question.id}/edit`, icon: "ph ph-pencil-simple" },
    ];

    if (approvableStatuses.has(question.status)) {
      items.push({ label: "Təsdiqlə", icon: "ph ph-check", onClick: () => runAction(question, approveAdminQuestion) });
    }

    items.push(
      { label: "Rədd et", icon: "ph ph-x", danger: true, onClick: () => runAction(question, rejectAdminQuestion) },
      { label: "Arxivlə", icon: "ph ph-archive", onClick: () => runAction(question, archiveAdminQuestion) }
    );

    return items;
  };

  return (
    <div className='px-24 py-24'>
      <div className='bg-white rounded-10 px-24 py-24'>
        <div className='d-flex flex-wrap align-items-center justify-content-between gap-16 mb-24'>
          <div>
            <h4 className='fw-semibold text-neutral-500 text-20 mb-4'>Suallar</h4>
            <p className='text-14 text-neutral-400 mb-0'>Sual bankına baxış və moderasiya.</p>
          </div>
          <div className='d-flex flex-wrap align-items-center gap-8'>
            <Link href='/admin/questions/new' className='btn btn-main rounded-pill px-20'>Sual yarat</Link>
            <button type='button' className='btn btn-main rounded-pill px-20' disabled={isApprovingAll} onClick={handleApproveAll}>
              {isApprovingAll ? "Təsdiqlənir..." : "Hamısını təsdiqlə"}
            </button>
            <AdminRefreshButton isLoading={isLoading} onClick={() => loadQuestions({ page: meta.page })} />
          </div>
        </div>

        <div className='d-flex flex-wrap align-items-center gap-12 mb-24'>
          <input className='common-input rounded-pill flex-grow-1 min-w-220-px' placeholder='Sual mətnində axtar...' value={filters.search} onChange={(event) => setFilter("search", event.target.value)} />
          <AdminSearchSelect
            value={filters.subjectCode}
            selectedLabel={subjectLabel}
            placeholder='Fənn axtar...'
            loadOptions={subjectOptions}
            onChange={setSubjectFilter}
            minWidthClass='min-w-220-px'
          />
          <AdminSearchSelect
            value={filters.topicCode}
            selectedLabel={topicLabel}
            placeholder={selectedSubjectId ? "Mövzu axtar..." : "Əvvəl fənn seç"}
            disabled={!selectedSubjectId}
            loadOptions={topicOptions}
            onChange={setTopicFilter}
            minWidthClass='min-w-220-px'
          />
          <AdminGradeSelect label='' placeholder='Sinif' value={filters.gradeId} onChange={setGradeFilter} minWidthClass='min-w-140-px' />
          <select className='form-select rounded-pill border-neutral-40 text-14 py-11 px-16 w-auto min-w-160-px' value={filters.difficulty} onChange={(event) => setFilter("difficulty", event.target.value)}>
            <option value=''>Çətinlik</option>
            {difficulties.map((item) => <option value={item} key={item}>{difficultyLabels[item]}</option>)}
          </select>
          <select className='form-select rounded-pill border-neutral-40 text-14 py-11 px-16 w-auto min-w-190-px' value={filters.type} onChange={(event) => setFilter("type", event.target.value)}>
            <option value=''>Tip</option>
            {types.map((item) => <option value={item} key={item}>{typeLabels[item]}</option>)}
          </select>
          <select className='form-select rounded-pill border-neutral-40 text-14 py-11 px-16 w-auto min-w-180-px' value={filters.status} onChange={(event) => setFilter("status", event.target.value)}>
            <option value=''>Status</option>
            {statuses.map((item) => <option value={item} key={item}>{statusLabels[item]}</option>)}
          </select>
        </div>

        <div className='table-responsive admin-users-table'>
          <table className='table mb-0'>
            <thead>
              <tr>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Sual</th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Fənn</th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Mövzu</th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Tip</th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Status</th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20 text-end'>Əməliyyat</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td className='py-20 px-20 text-neutral-400' colSpan='6'>Yüklənir...</td></tr>
              ) : questions.length ? (
                questions.map((question) => (
                  <tr key={question.id}>
                    <td className='py-16 px-20 text-14 text-neutral-500'>
                      <span>{questionHtmlToText(question.stem) || question.id}</span>
                      {question.mediaPath ? <span className='ms-8 text-12 text-main-600'>şəkil</span> : null}
                    </td>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{question.subjectId || "-"}</td>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{question.topicId || "-"}</td>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{typeLabels[question.type] || question.type || "-"}</td>
                    <td className='py-16 px-20'><AdminStatusBadge status={question.status} label={statusLabels[question.status]} /></td>
                    <td className='py-16 px-20'><div className='d-flex justify-content-end'><AdminRowActions items={actionsFor(question)} /></div></td>
                  </tr>
                ))
              ) : (
                <tr><td className='py-20 px-20 text-neutral-400' colSpan='6'>Sual tapılmadı.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className='d-flex align-items-center justify-content-end gap-8 mt-24'>
          <button type='button' className='px-14 py-8 border border-neutral-40 rounded-8 text-14 text-neutral-500' disabled={meta.page <= 1} onClick={() => loadQuestions({ page: Math.max(meta.page - 1, 1) })}>Əvvəlki</button>
          <span className='text-14 text-neutral-400'>{meta.page} / {meta.totalPages}</span>
          <button type='button' className='px-14 py-8 border border-neutral-40 rounded-8 text-14 text-neutral-500' disabled={meta.page >= meta.totalPages} onClick={() => loadQuestions({ page: Math.min(meta.page + 1, meta.totalPages) })}>Növbəti</button>
        </div>
      </div>
    </div>
  );
};

export default AdminQuestionsPage;
