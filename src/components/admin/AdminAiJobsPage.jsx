"use client";

import { useCallback, useEffect, useState } from "react";
import AdminGradeSelect from "@/components/admin/AdminGradeSelect";
import AdminRefreshButton from "@/components/admin/AdminRefreshButton";
import AdminSearchSelect from "@/components/admin/AdminSearchSelect";
import AdminStatusBadge from "@/components/admin/AdminStatusBadge";
import { fetchAdminAiJob, fetchAdminAiJobs, fetchSubjects, fetchTopics, generateAdminAiQuestions } from "@/lib/api";

const AdminAiJobsPage = () => {
  const [jobs, setJobs] = useState([]);
  const [meta, setMeta] = useState({ page: 1, perPage: 10, total: 0, totalPages: 1 });
  const [form, setForm] = useState({
    subjectId: "",
    gradeId: "",
    topicId: "",
    difficulty: "MEDIUM",
    questionType: "SINGLE_CHOICE",
    count: 10,
  });
  const [subjectLabel, setSubjectLabel] = useState("");
  const [topicLabel, setTopicLabel] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [error, setError] = useState("");

  const loadJobs = async (page = 1) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetchAdminAiJobs({ page, perPage: 10 });
      setJobs(response.data || []);
      setMeta(response.meta || { page, perPage: 10, total: 0, totalPages: 1 });
    } catch {
      setError("AI jobs could not be loaded.");
      setJobs([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    if (!selectedJob?.id || !["QUEUED", "RUNNING"].includes(selectedJob.status)) return undefined;
    const timer = window.setInterval(async () => {
      try {
        const job = await fetchAdminAiJob(selectedJob.id);
        setSelectedJob(job);
        if (!["QUEUED", "RUNNING"].includes(job?.status)) {
          await loadJobs(meta.page);
        }
      } catch {
        window.clearInterval(timer);
      }
    }, 3000);
    return () => window.clearInterval(timer);
  }, [meta.page, selectedJob?.id, selectedJob?.status]);

  const subjectOptions = useCallback((search) =>
    fetchSubjects({ page: 1, perPage: 20, search, active: "true" }).then((response) =>
      (response.data || []).map((subject) => ({
        value: subject.id,
        label: `${subject.name || subject.code} (${subject.code})`,
      }))
    ), []);

  const topicOptions = useCallback((search) => {
    if (!form.subjectId) return Promise.resolve([]);
    return fetchTopics(form.subjectId, { page: 1, perPage: 20, search, gradeId: form.gradeId, active: "true" }).then((response) =>
      (response.data || []).map((topic) => ({
        value: topic.id,
        label: `${topic.name || topic.code}${topic.code ? ` (${topic.code})` : ""}`,
      }))
    );
  }, [form.gradeId, form.subjectId]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const setSubject = (value, label) => {
    setForm((current) => ({ ...current, subjectId: value, topicId: "" }));
    setSubjectLabel(label);
    setTopicLabel("");
  };

  const setGrade = (value) => {
    setForm((current) => ({ ...current, gradeId: value, topicId: "" }));
    setTopicLabel("");
  };

  const setTopic = (value, label) => {
    setForm((current) => ({ ...current, topicId: value }));
    setTopicLabel(label);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.subjectId) return;

    setIsSubmitting(true);
    setError("");

    try {
      await generateAdminAiQuestions(form);
      await loadJobs(1);
    } catch {
      setError("AI generation job could not be started.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openJob = async (id) => {
    setSelectedJob({ id });
    setIsDetailLoading(true);
    setError("");
    try {
      setSelectedJob(await fetchAdminAiJob(id));
    } catch (requestError) {
      setSelectedJob(null);
      setError(requestError?.message || "AI job detail could not be loaded.");
    } finally {
      setIsDetailLoading(false);
    }
  };

  return (
    <div className='px-24 py-24'>
      <div className='bg-white rounded-10 px-24 py-24'>
        <div className='d-flex flex-wrap align-items-center justify-content-between gap-16 mb-24'>
          <div>
            <h4 className='fw-semibold text-neutral-500 text-20 mb-4'>AI Jobs</h4>
            <p className='text-14 text-neutral-400 mb-0'>Generate questions and track asynchronous jobs.</p>
          </div>
          <AdminRefreshButton isLoading={isLoading} onClick={() => loadJobs(meta.page)} />
        </div>

        <form className='d-flex flex-wrap align-items-center gap-12 mb-24' onSubmit={handleSubmit}>
          <AdminSearchSelect
            value={form.subjectId}
            selectedLabel={subjectLabel}
            placeholder='Search subjects...'
            required
            loadOptions={subjectOptions}
            onChange={setSubject}
            minWidthClass='min-w-220-px'
          />
          <AdminGradeSelect label='' value={form.gradeId} onChange={setGrade} minWidthClass='min-w-140-px' />
          <AdminSearchSelect
            value={form.topicId}
            selectedLabel={topicLabel}
            placeholder={form.subjectId ? "Search topics..." : "Select subject first"}
            disabled={!form.subjectId}
            loadOptions={topicOptions}
            onChange={setTopic}
            minWidthClass='min-w-220-px'
          />
          <select name='difficulty' className='form-select rounded-pill border-neutral-40 text-14 py-11 px-16 w-auto min-w-160-px' value={form.difficulty} onChange={handleChange}>
            <option value='EASY'>EASY</option>
            <option value='MEDIUM'>MEDIUM</option>
            <option value='HARD'>HARD</option>
          </select>
          <select name='questionType' className='form-select rounded-pill border-neutral-40 text-14 py-11 px-16 w-auto min-w-190-px' value={form.questionType} onChange={handleChange}>
            <option value='SINGLE_CHOICE'>SINGLE CHOICE</option>
            <option value='MULTIPLE_CHOICE'>MULTIPLE CHOICE</option>
            <option value='SHORT_TEXT'>SHORT TEXT</option>
          </select>
          <input name='count' type='number' min='1' max='50' className='common-input rounded-pill min-w-120-px' placeholder='Count' value={form.count} onChange={handleChange} />
          <button type='submit' className='btn btn-main rounded-pill px-24' disabled={isSubmitting}>
            {isSubmitting ? "Starting..." : "Generate"}
          </button>
        </form>

        {error ? <p className='text-danger mb-16'>{error}</p> : null}

        <div className='table-responsive admin-users-table'>
          <table className='table mb-0'>
            <thead>
              <tr>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Job</th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Subject</th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Type</th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Count</th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Status</th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20 text-end'>Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td className='py-20 px-20 text-neutral-400' colSpan='6'>Loading...</td></tr>
              ) : jobs.length ? (
                jobs.map((job) => (
                  <tr key={job.id}>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{job.id}</td>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{job.subjectId || "-"}</td>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{job.questionType || "-"}</td>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{job.generatedCount ?? 0} / {job.requestedCount ?? "-"}</td>
                    <td className='py-16 px-20'><AdminStatusBadge status={job.status} /></td>
                    <td className='py-16 px-20 text-end'><button type='button' className='px-14 py-8 border border-neutral-40 rounded-pill text-13 text-neutral-500 bg-white' onClick={() => openJob(job.id)}>Details</button></td>
                  </tr>
                ))
              ) : (
                <tr><td className='py-20 px-20 text-neutral-400' colSpan='6'>No AI jobs found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className='d-flex align-items-center justify-content-end gap-8 mt-24'>
          <button type='button' className='px-14 py-8 border border-neutral-40 rounded-8 text-14 text-neutral-500' disabled={meta.page <= 1} onClick={() => loadJobs(Math.max(meta.page - 1, 1))}>Previous</button>
          <span className='text-14 text-neutral-400'>{meta.page} / {meta.totalPages}</span>
          <button type='button' className='px-14 py-8 border border-neutral-40 rounded-8 text-14 text-neutral-500' disabled={meta.page >= meta.totalPages} onClick={() => loadJobs(Math.min(meta.page + 1, meta.totalPages))}>Next</button>
        </div>
      </div>

      {selectedJob ? (
        <div className='modal fade show d-block' tabIndex='-1' role='dialog' style={{ background: "rgba(15, 23, 42, 0.55)" }}>
          <div className='modal-dialog modal-dialog-centered modal-lg' role='document'>
            <div className='modal-content rounded-12 border-0'>
              <div className='modal-header border-neutral-30'>
                <div><h5 className='modal-title text-18 fw-semibold text-neutral-500'>AI generation job</h5><span className='text-12 text-neutral-400'>{selectedJob.id}</span></div>
                <button type='button' className='btn-close' aria-label='Close' onClick={() => setSelectedJob(null)} />
              </div>
              <div className='modal-body'>
                {isDetailLoading ? <p className='text-14 text-neutral-400 mb-0'>Loading...</p> : (
                  <>
                    <div className='row gy-3'>
                      <div className='col-md-4'><div className='border border-neutral-30 rounded-8 p-14'><span className='text-12 text-neutral-400 d-block'>Status</span><AdminStatusBadge status={selectedJob.status} /></div></div>
                      <div className='col-md-4'><div className='border border-neutral-30 rounded-8 p-14'><span className='text-12 text-neutral-400 d-block'>Generated</span><strong>{selectedJob.generatedCount ?? 0} / {selectedJob.requestedCount ?? "-"}</strong></div></div>
                      <div className='col-md-4'><div className='border border-neutral-30 rounded-8 p-14'><span className='text-12 text-neutral-400 d-block'>Model</span><strong className='text-13'>{selectedJob.model || "-"}</strong></div></div>
                      <div className='col-md-4'><div className='border border-neutral-30 rounded-8 p-14'><span className='text-12 text-neutral-400 d-block'>Subject</span><strong>#{selectedJob.subjectId || "-"}</strong></div></div>
                      <div className='col-md-4'><div className='border border-neutral-30 rounded-8 p-14'><span className='text-12 text-neutral-400 d-block'>Difficulty</span><strong>{selectedJob.difficulty || "-"}</strong></div></div>
                      <div className='col-md-4'><div className='border border-neutral-30 rounded-8 p-14'><span className='text-12 text-neutral-400 d-block'>Type</span><strong>{selectedJob.questionType || "-"}</strong></div></div>
                    </div>
                    {selectedJob.errorMessage ? <div className='alert alert-danger text-14 py-10 mt-16 mb-0'>{selectedJob.errorMessage}</div> : null}
                    {["QUEUED", "RUNNING"].includes(selectedJob.status) ? <p className='text-13 text-neutral-400 mt-16 mb-0'>Status refreshes automatically every 3 seconds.</p> : null}
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

export default AdminAiJobsPage;
