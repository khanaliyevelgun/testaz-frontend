"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import AdminRefreshButton from "@/components/admin/AdminRefreshButton";
import AdminStatusBadge from "@/components/admin/AdminStatusBadge";
import OrganizationSelector, {
  useOrganizationSelection,
} from "@/components/admin/OrganizationSelector";
import {
  createOrganizationInvite,
  fetchGrades,
  fetchOrganizationTestResults,
  fetchPublicSubjects,
  fetchPublicTopics,
} from "@/lib/api";
import { formatDateTime as formatDate } from "@/lib/format";
import StaticText from "@/components/StaticText";
import AdminTableSkeleton from "@/components/admin/AdminTableSkeleton";
import StaticOption from "@/components/StaticOption";



const emptyForm = {
  title: "",
  description: "",
  subjectId: "",
  gradeId: "",
  topicId: "",
  difficulty: "MEDIUM",
  questionCount: "10",
  durationMinutes: "60",
  maxUses: "100",
  ttlHours: "168",
};

const emptyMeta = {
  page: 1,
  perPage: 10,
  total: 0,
  totalPages: 1,
  hasNext: false,
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const optionalPositiveInteger = (value) => {
  if (value === "") return undefined;
  const numericValue = Number(value);
  if (!Number.isInteger(numericValue) || numericValue <= 0) return null;
  return numericValue;
};

const validateRange = (value, label, minimum, maximum, required = false) => {
  const parsedValue = optionalPositiveInteger(value);

  if (parsedValue === undefined) {
    return required ? `${label} is required.` : "";
  }

  if (parsedValue === null || parsedValue < minimum || parsedValue > maximum) {
    return `${label} must be between ${minimum} and ${maximum}.`;
  }

  return "";
};

const OrganizationInvitesPage = () => {
  const {
    organizations,
    selectedOrganization,
    selectedOrganizationId,
    selectOrganization,
    loadOrganizations,
    isLoadingOrganizations,
    organizationError,
  } = useOrganizationSelection();
  const [form, setForm] = useState(emptyForm);
  const [subjects, setSubjects] = useState([]);
  const [grades, setGrades] = useState([]);
  const [topics, setTopics] = useState([]);
  const [isLoadingTaxonomy, setIsLoadingTaxonomy] = useState(true);
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [taxonomyError, setTaxonomyError] = useState("");
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [createdInvite, setCreatedInvite] = useState(null);
  const [copyStatus, setCopyStatus] = useState("");
  const [testId, setTestId] = useState("");
  const [results, setResults] = useState([]);
  const [resultMeta, setResultMeta] = useState(emptyMeta);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [hasLoadedResults, setHasLoadedResults] = useState(false);
  const [resultError, setResultError] = useState("");

  const loadTaxonomy = useCallback(async () => {
    setIsLoadingTaxonomy(true);
    setTaxonomyError("");

    try {
      const [subjectResponse, gradeResponse] = await Promise.all([
        fetchPublicSubjects(),
        fetchGrades(),
      ]);
      setSubjects(Array.isArray(subjectResponse) ? subjectResponse : []);
      setGrades(Array.isArray(gradeResponse) ? gradeResponse : []);
    } catch (requestError) {
      setSubjects([]);
      setGrades([]);
      setTaxonomyError(requestError?.message || "Fənlər və siniflər yüklənmədi.");
    } finally {
      setIsLoadingTaxonomy(false);
    }
  }, []);

  useEffect(() => {
    loadTaxonomy();
  }, [loadTaxonomy]);

  useEffect(() => {
    if (!form.subjectId) {
      setTopics([]);
      setIsLoadingTopics(false);
      return;
    }

    let isMounted = true;
    setIsLoadingTopics(true);
    setTaxonomyError("");

    const subjectCode = subjects.find((subject) => String(subject.id) === String(form.subjectId))?.code;
    if (!subjectCode) {
      setTopics([]);
      setIsLoadingTopics(false);
      return;
    }

    fetchPublicTopics(subjectCode)
      .then((response) => {
        if (isMounted) setTopics(Array.isArray(response) ? response : []);
      })
      .catch((requestError) => {
        if (!isMounted) return;
        setTopics([]);
        setTaxonomyError(requestError?.message || "Mövzular yüklənmədi.");
      })
      .finally(() => {
        if (isMounted) setIsLoadingTopics(false);
      });

    return () => {
      isMounted = false;
    };
  }, [form.subjectId, subjects]);

  const loadResults = useCallback(
    async (
      page = 1,
      requestedTestId = testId.trim(),
      organizationId = selectedOrganizationId
    ) => {
      setResultError("");

      if (!organizationId) {
        setResultError("Select an organization before loading results.");
        return;
      }

      if (!requestedTestId) {
        setResultError("Test ID-si tələb olunur.");
        return;
      }

      if (!uuidPattern.test(requestedTestId)) {
        setResultError("Enter a valid test UUID.");
        return;
      }

      setIsLoadingResults(true);
      setHasLoadedResults(true);

      try {
        const response = await fetchOrganizationTestResults(
          organizationId,
          requestedTestId,
          { page, perPage: 10 }
        );
        setResults(response.data || []);
        setResultMeta(response.meta || { ...emptyMeta, page });
      } catch (requestError) {
        setResults([]);
        setResultMeta({ ...emptyMeta, page });
        setResultError(requestError?.message || "Test nəticələri yüklənmədi.");
      } finally {
        setIsLoadingResults(false);
      }
    },
    [selectedOrganizationId, testId]
  );

  const handleOrganizationChange = (organizationId) => {
    selectOrganization(organizationId);
    setCreatedInvite(null);
    setCopyStatus("");
    setTestId("");
    setResults([]);
    setResultMeta(emptyMeta);
    setHasLoadedResults(false);
    setResultError("");
    setNotice("");
    setFormError("");
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => {
      if (name === "subjectId" || name === "gradeId") {
        return { ...current, [name]: value, topicId: "" };
      }
      return { ...current, [name]: value };
    });
  };

  const validateInvite = () => {
    if (!selectedOrganizationId) return "Select an organization.";
    if (!form.subjectId) return "Fənn tələb olunur.";
    if (form.title.trim().length > 200) {
      return "Başlıq 200 simvoldan uzun ola bilməz.";
    }
    if (form.description.trim().length > 2000) {
      return "Təsvir 2000 simvoldan uzun ola bilməz.";
    }

    return (
      validateRange(form.questionCount, "Question count", 1, 100, true) ||
      validateRange(form.durationMinutes, "Duration", 1, 600) ||
      validateRange(form.maxUses, "Maximum uses", 1, 10000) ||
      validateRange(form.ttlHours, "Invite lifetime", 1, 8760)
    );
  };

  const buildPayload = () => ({
    title: form.title.trim() || undefined,
    description: form.description.trim() || undefined,
    subjectId: Number(form.subjectId),
    gradeId: form.gradeId ? Number(form.gradeId) : undefined,
    topicId: form.topicId ? Number(form.topicId) : undefined,
    difficulty: form.difficulty,
    questionCount: optionalPositiveInteger(form.questionCount),
    durationMinutes: optionalPositiveInteger(form.durationMinutes),
    maxUses: optionalPositiveInteger(form.maxUses),
    ttlHours: optionalPositiveInteger(form.ttlHours),
  });

  const handleCreateInvite = async (event) => {
    event.preventDefault();
    const validationError = validateInvite();

    setFormError("");
    setNotice("");
    setCopyStatus("");

    if (validationError) {
      setFormError(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      const invite = await createOrganizationInvite(
        selectedOrganizationId,
        buildPayload()
      );
      setCreatedInvite(invite);
      setNotice("Test dəvəti uğurla yaradıldı.");

      if (invite?.testId) {
        setTestId(invite.testId);
        await loadResults(1, invite.testId, selectedOrganizationId);
      }
    } catch (requestError) {
      setFormError(requestError?.message || "Test dəvəti yaradılmadı.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyInviteCode = async () => {
    if (!createdInvite?.code) return;

    try {
      await navigator.clipboard.writeText(createdInvite.code);
      setCopyStatus("Kod kopyalandı.");
    } catch {
      setCopyStatus("Kopyalama alınmadı. Kodu seçib əl ilə kopyalayın.");
    }
  };

  const handleResultSubmit = (event) => {
    event.preventDefault();
    loadResults(1);
  };

  const refreshPage = async () => {
    await Promise.all([
      loadOrganizations(selectedOrganizationId),
      loadTaxonomy(),
    ]);

    if (hasLoadedResults && testId.trim()) {
      await loadResults(resultMeta.page);
    }
  };

  const pageError = formError || organizationError;
  const isRefreshing =
    isLoadingOrganizations || isLoadingTaxonomy || isLoadingResults;

  return (
    <div className='px-24 py-24'>
      <div className='bg-white rounded-10 px-24 py-24 mb-24'>
        <div className='d-flex flex-wrap align-items-start justify-content-between gap-16 mb-24'>
          <div>
            <h4 className='fw-semibold text-neutral-500 text-20 mb-4'>
              <StaticText text={"Organization test invites"} />
            </h4>
            <p className='text-14 text-neutral-400 mb-0'>
              <StaticText text={"Build a fixed test, share its code and review member results."} />
            </p>
          </div>
          <div className='d-flex flex-wrap gap-8'>
            {selectedOrganizationId ? (
              <Link
                href={`/admin/members?orgId=${encodeURIComponent(selectedOrganizationId)}`}
                className='px-16 py-10 border border-neutral-40 rounded-pill text-14 text-neutral-500 bg-white'
              >
                <StaticText text={"View members"} />
              </Link>
            ) : null}
            <AdminRefreshButton isLoading={isRefreshing} onClick={refreshPage} />
          </div>
        </div>

        {notice ? (
          <div className='alert alert-success text-14 py-10 mb-16'>{notice}</div>
        ) : null}
        {pageError ? (
          <div className='alert alert-danger text-14 py-10 mb-16'>{pageError}</div>
        ) : null}
        {taxonomyError ? (
          <div className='alert alert-warning text-14 py-10 mb-16'>
            {taxonomyError}
          </div>
        ) : null}

        <div className='row gy-3 align-items-end mb-24'>
          <div className='col-lg-8'>
            <OrganizationSelector
              organizations={organizations}
              selectedOrganizationId={selectedOrganizationId}
              isLoading={isLoadingOrganizations}
              onChange={handleOrganizationChange}
            />
          </div>
          <div className='col-lg-4'>
            <div className='border border-neutral-30 rounded-10 px-16 py-12'>
              <span className='text-12 text-neutral-400 d-block mb-2'>
                <StaticText text={"Selected organization"} />
              </span>
              <span className='text-14 fw-medium text-neutral-500'>
                {selectedOrganization?.name || "-"}
              </span>
            </div>
          </div>
        </div>

        {!isLoadingOrganizations && !organizations.length ? (
          <div className='border border-neutral-30 rounded-10 px-20 py-24 text-center'>
            <p className='text-14 text-neutral-400 mb-12'>
              <StaticText text={"Create an organization before generating an invite."} />
            </p>
            <Link href='/admin/organizations' className='btn btn-main rounded-pill px-20'>
              <StaticText text={"Go to organizations"} />
            </Link>
          </div>
        ) : (
          <form onSubmit={handleCreateInvite}>
            <div className='row gy-3'>
              <div className='col-lg-6'>
                <label className='text-14 text-neutral-500 fw-medium mb-8'>
                  <StaticText text={"Title"} />
                </label>
                <input
                  name='title'
                  className='common-input rounded-pill'
                  value={form.title}
                  maxLength='200'
                  placeholder='Test başlığı (opsional)'
                  disabled={isSubmitting}
                  onChange={handleFormChange}
                />
              </div>
              <div className='col-lg-6'>
                <label className='text-14 text-neutral-500 fw-medium mb-8'>
                  <StaticText text={"Subject"} />
                </label>
                <select
                  name='subjectId'
                  className='form-select rounded-pill border-neutral-40 text-14 py-11 px-16'
                  value={form.subjectId}
                  disabled={isLoadingTaxonomy || isSubmitting}
                  onChange={handleFormChange}
                >
                  <StaticOption
                    value=''
                    text={isLoadingTaxonomy ? "Loading subjects..." : "Select subject"}
                  />
                  {subjects.map((subject) => (
                    <option value={subject.id} key={subject.id}>
                      {subject.name || subject.nameAz || subject.code}
                      {subject.code ? ` (${subject.code})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className='col-12'>
                <label className='text-14 text-neutral-500 fw-medium mb-8'>
                  <StaticText text={"Description"} />
                </label>
                <textarea
                  name='description'
                  className='common-input rounded-12'
                  rows='3'
                  value={form.description}
                  maxLength='2000'
                  placeholder='Şagirdlər üçün əlavə təlimatlar (opsional)'
                  disabled={isSubmitting}
                  onChange={handleFormChange}
                />
              </div>
              <div className='col-lg-3 col-md-6'>
                <label className='text-14 text-neutral-500 fw-medium mb-8'>
                  <StaticText text={"Grade"} />
                </label>
                <select
                  name='gradeId'
                  className='form-select rounded-pill border-neutral-40 text-14 py-11 px-16'
                  value={form.gradeId}
                  disabled={isLoadingTaxonomy || isSubmitting}
                  onChange={handleFormChange}
                >
                  <StaticOption value='' text={"All grades"} />
                  {grades.map((grade) => (
                    <option value={grade.id} key={grade.id}>
                      {grade.nameAz || grade.code || `Grade ${grade.level || grade.id}`}
                    </option>
                  ))}
                </select>
              </div>
              <div className='col-lg-3 col-md-6'>
                <label className='text-14 text-neutral-500 fw-medium mb-8'>
                  <StaticText text={"Topic"} />
                </label>
                <select
                  name='topicId'
                  className='form-select rounded-pill border-neutral-40 text-14 py-11 px-16'
                  value={form.topicId}
                  disabled={!form.subjectId || isLoadingTopics || isSubmitting}
                  onChange={handleFormChange}
                >
                  <StaticOption
                    value=''
                    text={isLoadingTopics ? "Loading topics..." : "All topics"}
                  />
                  {topics.map((topic) => (
                    <option value={topic.id} key={topic.id}>
                      {topic.name || topic.nameAz || topic.code}
                      {topic.code ? ` (${topic.code})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className='col-lg-3 col-md-6'>
                <label className='text-14 text-neutral-500 fw-medium mb-8'>
                  <StaticText text={"Difficulty"} />
                </label>
                <select
                  name='difficulty'
                  className='form-select rounded-pill border-neutral-40 text-14 py-11 px-16'
                  value={form.difficulty}
                  disabled={isSubmitting}
                  onChange={handleFormChange}
                >
                  <StaticOption value='EASY' text={"Easy"} />
                  <StaticOption value='MEDIUM' text={"Medium"} />
                  <StaticOption value='HARD' text={"Hard"} />
                </select>
              </div>
              <div className='col-lg-3 col-md-6'>
                <label className='text-14 text-neutral-500 fw-medium mb-8'>
                  <StaticText text={"Questions"} />
                </label>
                <input
                  name='questionCount'
                  className='common-input rounded-pill'
                  type='number'
                  min='1'
                  max='100'
                  value={form.questionCount}
                  disabled={isSubmitting}
                  onChange={handleFormChange}
                />
              </div>
              <div className='col-lg-4 col-md-6'>
                <label className='text-14 text-neutral-500 fw-medium mb-8'>
                  <StaticText text={"Duration (minutes)"} />
                </label>
                <input
                  name='durationMinutes'
                  className='common-input rounded-pill'
                  type='number'
                  min='1'
                  max='600'
                  value={form.durationMinutes}
                  disabled={isSubmitting}
                  onChange={handleFormChange}
                />
              </div>
              <div className='col-lg-4 col-md-6'>
                <label className='text-14 text-neutral-500 fw-medium mb-8'>
                  <StaticText text={"Maximum uses"} />
                </label>
                <input
                  name='maxUses'
                  className='common-input rounded-pill'
                  type='number'
                  min='1'
                  max='10000'
                  value={form.maxUses}
                  disabled={isSubmitting}
                  onChange={handleFormChange}
                />
              </div>
              <div className='col-lg-4 col-md-6'>
                <label className='text-14 text-neutral-500 fw-medium mb-8'>
                  <StaticText text={"Invite lifetime (hours)"} />
                </label>
                <input
                  name='ttlHours'
                  className='common-input rounded-pill'
                  type='number'
                  min='1'
                  max='8760'
                  value={form.ttlHours}
                  disabled={isSubmitting}
                  onChange={handleFormChange}
                />
              </div>
            </div>

            <div className='d-flex justify-content-end mt-24'>
              <button
                type='submit'
                className='btn btn-main rounded-pill px-24'
                disabled={isSubmitting || !selectedOrganizationId}
              >
                {isSubmitting ? <StaticText text={"Creating invite..."} /> : <StaticText text={"Create test invite"} />}
              </button>
            </div>
          </form>
        )}
      </div>

      {createdInvite ? (
        <div className='bg-white rounded-10 px-24 py-24 mb-24 border border-success-200'>
          <div className='d-flex flex-wrap align-items-start justify-content-between gap-16 mb-20'>
            <div>
              <span className='text-12 fw-semibold text-success-600 d-block mb-4'>
                <StaticText text={"INVITE READY"} />
              </span>
              <h5 className='text-18 fw-semibold text-neutral-500 mb-0'>
                <StaticText text={"Share this code with learners"} />
              </h5>
            </div>
            <AdminStatusBadge status={createdInvite.status || "ACTIVE"} />
          </div>

          <div className='row gy-3'>
            <div className='col-lg-6'>
              <label className='text-13 text-neutral-400 mb-6'><StaticText text={"Invite code"} /></label>
              <div className='d-flex gap-8'>
                <input
                  className='common-input rounded-pill font-monospace'
                  value={createdInvite.code || ""}
                  readOnly
                />
                <button
                  type='button'
                  className='btn btn-main rounded-pill px-20'
                  disabled={!createdInvite.code}
                  onClick={copyInviteCode}
                >
                  <StaticText text={"Copy"} />
                </button>
              </div>
              {copyStatus ? (
                <span className='text-12 text-neutral-400 d-block mt-6'>
                  {copyStatus}
                </span>
              ) : null}
            </div>
            <div className='col-lg-6'>
              <label className='text-13 text-neutral-400 mb-6'><StaticText text={"Test ID"} /></label>
              <input
                className='common-input rounded-pill font-monospace'
                value={createdInvite.testId || ""}
                readOnly
              />
            </div>
            <div className='col-md-4'>
              <span className='text-13 text-neutral-400 d-block'><StaticText text={"Usage"} /></span>
              <span className='text-14 fw-medium text-neutral-500'>
                {createdInvite.usedCount ?? 0} / {createdInvite.maxUses ?? "-"}
              </span>
            </div>
            <div className='col-md-4'>
              <span className='text-13 text-neutral-400 d-block'><StaticText text={"Expires"} /></span>
              <span className='text-14 fw-medium text-neutral-500'>
                {formatDate(createdInvite.expiresAt)}
              </span>
            </div>
            <div className='col-md-4'>
              <span className='text-13 text-neutral-400 d-block'><StaticText text={"Invite ID"} /></span>
              <span className='text-14 fw-medium text-neutral-500 font-monospace'>
                {createdInvite.id || "-"}
              </span>
            </div>
          </div>
        </div>
      ) : null}

      <div className='bg-white rounded-10 px-24 py-24'>
        <div className='d-flex flex-wrap align-items-start justify-content-between gap-16 mb-20'>
          <div>
            <h5 className='text-18 fw-semibold text-neutral-500 mb-4'>
              <StaticText text={"Test results"} />
            </h5>
            <p className='text-14 text-neutral-400 mb-0'>
              <StaticText text={"Enter a test ID created for the selected organization."} />
            </p>
          </div>
        </div>

        <form className='row gy-3 align-items-end mb-20' onSubmit={handleResultSubmit}>
          <div className='col-lg-9'>
            <label className='text-14 text-neutral-500 fw-medium mb-8'>
              <StaticText text={"Test ID"} />
            </label>
            <input
              className='common-input rounded-pill font-monospace'
              value={testId}
              placeholder='00000000-0000-0000-0000-000000000000'
              onChange={(event) => {
                setTestId(event.target.value.trim());
                setResults([]);
                setResultMeta(emptyMeta);
                setHasLoadedResults(false);
                setResultError("");
              }}
            />
          </div>
          <div className='col-lg-3'>
            <button
              type='submit'
              className='btn btn-main rounded-pill w-100'
              disabled={isLoadingResults || !selectedOrganizationId}
            >
              {isLoadingResults ? <StaticText text={"Loading..."} /> : <StaticText text={"View results"} />}
            </button>
          </div>
        </form>

        {resultError ? (
          <div className='alert alert-danger text-14 py-10 mb-16'>{resultError}</div>
        ) : null}

        <div className='table-responsive admin-users-table'>
          <table className='table mb-0'>
            <thead>
              <tr>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>
                  <StaticText text={"Student"} />
                </th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>
                  <StaticText text={"Type"} />
                </th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>
                  <StaticText text={"Score"} />
                </th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>
                  <StaticText text={"Correct"} />
                </th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>
                  <StaticText text={"Scored at"} />
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoadingResults ? (
                <AdminTableSkeleton columns={5} />
              ) : results.length ? (
                results.map((result) => (
                  <tr key={result.id || result.sessionId}>
                    <td className='py-16 px-20 text-14 text-neutral-500'>
                      {result.studentName ? (
                        <>
                          <span className='d-block'>{result.studentName}</span>
                          <span className='font-monospace text-12 text-neutral-400'>{result.studentId}</span>
                        </>
                      ) : (
                        <span className='font-monospace'>{result.studentId || "-"}</span>
                      )}
                    </td>
                    <td className='py-16 px-20 text-14 text-neutral-500'>
                      {String(result.type || "-").replaceAll("_", " ")}
                    </td>
                    <td className='py-16 px-20 text-14 text-neutral-500'>
                      {result.percentage != null
                        ? `${Number(result.percentage).toFixed(1)}%`
                        : `${result.totalScore ?? "-"} / ${result.maxScore ?? "-"}`}
                      {result.scoringMode ? (
                        <span className='text-12 text-neutral-400 d-block'>
                          {String(result.scoringMode).replaceAll("_", " ")}
                        </span>
                      ) : null}
                    </td>
                    <td className='py-16 px-20 text-14 text-neutral-500'>
                      {result.correctCount ?? "-"} / {result.totalQuestions ?? "-"}
                    </td>
                    <td className='py-16 px-20 text-14 text-neutral-500'>
                      {formatDate(result.scoredAt)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className='py-20 px-20 text-neutral-400' colSpan='5'>
                    {hasLoadedResults
                      ? <StaticText text={"No results found for this test."} />
                      : <StaticText text={"Enter a test ID to load results."} />}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className='d-flex flex-wrap align-items-center justify-content-between gap-12 mt-24'>
          <span className='text-13 text-neutral-400'>
            {resultMeta.total} {resultMeta.total === 1 ? <StaticText text={"result"} /> : <StaticText text={"results"} />}
          </span>
          <div className='d-flex align-items-center gap-8'>
            <button
              type='button'
              className='px-14 py-8 border border-neutral-40 rounded-8 text-14 text-neutral-500 bg-white'
              disabled={isLoadingResults || resultMeta.page <= 1}
              onClick={() => loadResults(Math.max(resultMeta.page - 1, 1))}
            >
              <StaticText text={"Previous"} />
            </button>
            <span className='text-14 text-neutral-400'>
              {resultMeta.page} / {Math.max(resultMeta.totalPages, 1)}
            </span>
            <button
              type='button'
              className='px-14 py-8 border border-neutral-40 rounded-8 text-14 text-neutral-500 bg-white'
              disabled={
                isLoadingResults ||
                !hasLoadedResults ||
                resultMeta.page >= Math.max(resultMeta.totalPages, 1)
              }
              onClick={() =>
                loadResults(
                  Math.min(resultMeta.page + 1, Math.max(resultMeta.totalPages, 1))
                )
              }
            >
              <StaticText text={"Next"} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizationInvitesPage;
