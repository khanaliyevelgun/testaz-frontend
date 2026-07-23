"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AdminGradeSelect from "@/components/admin/AdminGradeSelect";
import AdminRefreshButton from "@/components/admin/AdminRefreshButton";
import AdminRowActions from "@/components/admin/AdminRowActions";
import AdminSearchSelect from "@/components/admin/AdminSearchSelect";
import AdminStatusBadge from "@/components/admin/AdminStatusBadge";
import {
  approveAllAdminQuestions,
  archiveAdminQuestion,
  fetchAdminQuestions,
  fetchSubjects,
  fetchTopics,
  rejectAdminQuestion,
} from "@/lib/api";
import { questionHtmlToText } from "@/lib/questionContent";
import StaticText from "@/components/StaticText";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import AdminTableSkeleton from "@/components/admin/AdminTableSkeleton";
import StaticOption from "@/components/StaticOption";



const PAGE_SIZE = 10;

const statuses = ["DRAFT", "PENDING_REVIEW", "ACTIVE", "REJECTED", "ARCHIVED"];
const difficulties = ["EASY", "MEDIUM", "HARD"];
const types = ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "SHORT_TEXT"];
const statusLabels = {
  DRAFT: "Draft",
  PENDING_REVIEW: "Pending review",
  ACTIVE: "Active",
  REJECTED: "Rejected",
  ARCHIVED: "Archived",
};
const difficultyLabels = {
  EASY: "Easy",
  MEDIUM: "Medium",
  HARD: "Hard",
};
const typeLabels = {
  SINGLE_CHOICE: "Single choice",
  MULTIPLE_CHOICE: "Multiple choice",
  SHORT_TEXT: "Short text",
};

const initialFilters = {
  search: "",
  subjectCode: "",
  topicCode: "",
  gradeId: "",
  difficulty: "",
  type: "",
  status: "",
};

const AdminQuestionsPage = () => {
  const latestRequestRef = useRef(0);
  const [questions, setQuestions] = useState([]);
  const [meta, setMeta] = useState({ page: 1, perPage: PAGE_SIZE, total: 0, totalPages: 1, hasNext: false });
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState(initialFilters);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [subjectLabel, setSubjectLabel] = useState("");
  const [topicLabel, setTopicLabel] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isApprovingAll, setIsApprovingAll] = useState(false);
  const [error, setError] = useState("");

  const effectiveFilters = useMemo(
    () => ({
      search: debouncedSearch,
      subjectCode: filters.subjectCode,
      topicCode: filters.topicCode,
      gradeId: filters.gradeId,
      difficulty: filters.difficulty,
      type: filters.type,
      status: filters.status,
    }),
    [
      debouncedSearch,
      filters.subjectCode,
      filters.topicCode,
      filters.gradeId,
      filters.difficulty,
      filters.type,
      filters.status,
    ]
  );

  const loadQuestions = useCallback(
    async ({ nextPage = page, force = false } = {}) => {
      const requestId = latestRequestRef.current + 1;
      latestRequestRef.current = requestId;
      setIsLoading(true);
      setError("");

      try {
        const response = await fetchAdminQuestions({ page: nextPage, perPage: PAGE_SIZE, ...effectiveFilters });
        if (requestId !== latestRequestRef.current) return;

        const responseMeta = response.meta || {};
        const resolvedPage = responseMeta.page || nextPage;
        const resolvedTotalPages = Math.max(responseMeta.totalPages || 1, 1);

        setQuestions(response.data || []);
        setMeta({
          page: resolvedPage,
          perPage: responseMeta.perPage || PAGE_SIZE,
          total: responseMeta.total || 0,
          totalPages: resolvedTotalPages,
          hasNext: Boolean(responseMeta.hasNext),
        });
        if (force || resolvedPage !== page) {
          setPage(resolvedPage);
        }
      } catch (requestError) {
        if (requestId !== latestRequestRef.current) return;
        setError(requestError?.message || "Suallar yüklənmədi.");
        setQuestions([]);
        setMeta({ page: nextPage, perPage: PAGE_SIZE, total: 0, totalPages: 1, hasNext: false });
      } finally {
        if (requestId === latestRequestRef.current) {
          setIsLoading(false);
        }
      }
    },
    [effectiveFilters, page]
  );

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(filters.search.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [filters.search]);

  useEffect(() => {
    setPage(1);
  }, [effectiveFilters]);

  useEffect(() => {
    loadQuestions({ nextPage: page });
  }, [loadQuestions, page]);

  const setFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const subjectOptions = useCallback(
    (search) =>
      fetchSubjects({ page: 1, perPage: 20, search, active: "true" }).then((response) =>
        (response.data || []).map((subject) => ({
          value: subject.code,
          label: `${subject.name || subject.code} (${subject.code})`,
          subjectId: subject.id,
        }))
      ),
    []
  );

  const topicOptions = useCallback(
    (search) => {
      if (!selectedSubjectId) return Promise.resolve([]);
      return fetchTopics(selectedSubjectId, { page: 1, perPage: 20, search, gradeId: filters.gradeId, active: "true" }).then(
        (response) =>
          (response.data || []).map((topic) => ({
            value: topic.code,
            label: `${topic.name || topic.code}${topic.code ? ` (${topic.code})` : ""}`,
          }))
      );
    },
    [filters.gradeId, selectedSubjectId]
  );

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
      await loadQuestions({ nextPage: page, force: true });
    } catch (requestError) {
      setError(requestError?.message || "Sual əməliyyatı alınmadı.");
    }
  };

  const handleApproveAll = async () => {
    const confirmed = window.confirm("Gözləyən bütün sualları təsdiqləyək?");
    if (!confirmed) return;

    setIsApprovingAll(true);
    setError("");
    try {
      const count = await approveAllAdminQuestions();
      setPage(1);
      await loadQuestions({ nextPage: 1, force: true });
      window.alert(`${count} questions approved.`);
    } catch (requestError) {
      setError(requestError?.message || "Toplu təsdiq alınmadı.");
    } finally {
      setIsApprovingAll(false);
    }
  };

  const actionsFor = (question) => {
    const items = [{ label: "Edit", href: `/admin/questions/${question.id}/edit`, icon: "ph ph-pencil-simple" }];

    items.push(
      { label: "Reject", icon: "ph ph-x", danger: true, onClick: () => runAction(question, rejectAdminQuestion) },
      { label: "Archive", icon: "ph ph-archive", onClick: () => runAction(question, archiveAdminQuestion) }
    );

    return items;
  };

  const canGoPrevious = page > 1 && !isLoading;
  const canGoNext = !isLoading && (meta.hasNext || page < meta.totalPages);

  return (
    <div className='px-24 py-24'>
      <div className='bg-white rounded-10 px-24 py-24'>
        <div className='d-flex flex-wrap align-items-center justify-content-between gap-16 mb-24'>
          <div>
            <h4 className='fw-semibold text-neutral-500 text-20 mb-4'><StaticText text={"Questions"} /></h4>
            <p className='text-14 text-neutral-400 mb-0'><StaticText text={"Question bank review and moderation."} /></p>
          </div>
          <div className='d-flex flex-wrap align-items-center gap-8'>
            <Link href='/admin/questions/new' className='btn btn-main rounded-pill px-20'><StaticText text={"Create Question"} /></Link>
            <button type='button' className='btn btn-main rounded-pill px-20' disabled={isApprovingAll} onClick={handleApproveAll}>
              {isApprovingAll ? <StaticText text={"Approving..."} /> : <StaticText text={"Approve All"} />}
            </button>
            <AdminRefreshButton isLoading={isLoading} onClick={() => loadQuestions({ nextPage: page, force: true })} />
          </div>
        </div>

        <div className='d-flex flex-wrap align-items-center gap-12 mb-24'>
          <input
            type='search'
            className='common-input rounded-pill flex-grow-1 min-w-220-px'
            aria-label='Sual mətni üzrə axtar'
            placeholder='Sual mətni üzrə axtar...'
            value={filters.search}
            onChange={(event) => setFilter("search", event.target.value)}
          />
          <AdminSearchSelect
            value={filters.subjectCode}
            selectedLabel={subjectLabel}
            placeholder='Fənn üzrə axtar...'
            loadOptions={subjectOptions}
            onChange={setSubjectFilter}
            minWidthClass='min-w-220-px'
          />
          <AdminSearchSelect
            value={filters.topicCode}
            selectedLabel={topicLabel}
            placeholder={selectedSubjectId ? "Search topic..." : "Select subject first"}
            disabled={!selectedSubjectId}
            loadOptions={topicOptions}
            onChange={setTopicFilter}
            minWidthClass='min-w-220-px'
          />
          <AdminGradeSelect label='' placeholder='Sinif' value={filters.gradeId} onChange={setGradeFilter} minWidthClass='min-w-140-px' />
          <select className='form-select rounded-pill border-neutral-40 text-14 py-11 px-16 w-auto min-w-160-px' value={filters.difficulty} onChange={(event) => setFilter("difficulty", event.target.value)}>
            <StaticOption value='' text={"Difficulty"} />
            {difficulties.map((item) => <option value={item} key={item}>{difficultyLabels[item]}</option>)}
          </select>
          <select className='form-select rounded-pill border-neutral-40 text-14 py-11 px-16 w-auto min-w-190-px' value={filters.type} onChange={(event) => setFilter("type", event.target.value)}>
            <StaticOption value='' text={"Type"} />
            {types.map((item) => <option value={item} key={item}>{typeLabels[item]}</option>)}
          </select>
          <select className='form-select rounded-pill border-neutral-40 text-14 py-11 px-16 w-auto min-w-180-px' value={filters.status} onChange={(event) => setFilter("status", event.target.value)}>
            <StaticOption value='' text={"Status"} />
            {statuses.map((item) => <option value={item} key={item}>{statusLabels[item]}</option>)}
          </select>
        </div>

        {error ? <p className='text-danger mb-16'>{error}</p> : null}

        <div className='table-responsive admin-users-table'>
          <table className='table mb-0'>
            <thead>
              <tr>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'><StaticText text={"Question"} /></th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'><StaticText text={"Subject"} /></th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'><StaticText text={"Topic"} /></th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'><StaticText text={"Difficulty"} /></th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'><StaticText text={"Type"} /></th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'><StaticText text={"Status"} /></th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20 text-end'><StaticText text={"Action"} /></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <AdminTableSkeleton columns={7} />
              ) : questions.length ? (
                questions.map((question) => (
                  <tr key={question.id}>
                    <td className='py-16 px-20 text-14 text-neutral-500'>
                      <span className='line-clamp-2'>{questionHtmlToText(question.stem) || question.id}</span>
                      <span className='d-block text-12 text-neutral-400'>{question.id}</span>
                    </td>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{question.subjectId || "-"}</td>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{question.topicId || "-"}</td>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{difficultyLabels[question.difficulty] || question.difficulty || "-"}</td>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{typeLabels[question.type] || question.type || "-"}</td>
                    <td className='py-16 px-20'><AdminStatusBadge status={question.status} label={statusLabels[question.status]} /></td>
                    <td className='py-16 px-20'><div className='d-flex justify-content-end'><AdminRowActions items={actionsFor(question)} /></div></td>
                  </tr>
                ))
              ) : (
                <AdminEmptyState columns={7} icon='ph ph-question' action={{ href: "/admin/questions/new", label: <StaticText text={"Create Question"} /> }}><StaticText text={"No questions found."} /></AdminEmptyState>
              )}
            </tbody>
          </table>
        </div>

        <div className='d-flex align-items-center justify-content-end gap-8 mt-24'>
          <button
            type='button'
            className='px-14 py-8 border border-neutral-40 rounded-8 text-14 text-neutral-500'
            disabled={!canGoPrevious}
            onClick={() => setPage((current) => Math.max(current - 1, 1))}
          >
            <StaticText text={"Previous"} />
          </button>
          <span className='text-14 text-neutral-400'>{page} / {meta.totalPages}</span>
          <button
            type='button'
            className='px-14 py-8 border border-neutral-40 rounded-8 text-14 text-neutral-500'
            disabled={!canGoNext}
            onClick={() => setPage((current) => Math.min(current + 1, Math.max(meta.totalPages, current + 1)))}
          >
            <StaticText text={"Next"} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminQuestionsPage;
