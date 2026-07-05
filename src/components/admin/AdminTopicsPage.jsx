"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import AdminGradeSelect from "@/components/admin/AdminGradeSelect";
import AdminRefreshButton from "@/components/admin/AdminRefreshButton";
import AdminRowActions from "@/components/admin/AdminRowActions";
import AdminSearchSelect from "@/components/admin/AdminSearchSelect";
import AdminStatusBadge from "@/components/admin/AdminStatusBadge";
import { activateTopic, createTopic, deactivateTopic, fetchTopics, updateTopic } from "@/lib/api";

const AdminTopicsPage = ({ subjectId }) => {
  const [topics, setTopics] = useState([]);
  const [meta, setMeta] = useState({ page: 1, perPage: 10, total: 0, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [active, setActive] = useState("");
  const [gradeId, setGradeId] = useState("");
  const [form, setForm] = useState({ nameAz: "", code: "", gradeId: "", parentTopicId: "" });
  const [parentTopicLabel, setParentTopicLabel] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const loadTopics = async (page = 1) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetchTopics(subjectId, { page, perPage: 10, search, gradeId, active });
      setTopics(response.data || []);
      setMeta(response.meta || { page, perPage: 10, total: 0, totalPages: 1 });
    } catch {
      setError("Topics could not be loaded.");
      setTopics([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTopics(1);
  }, [subjectId, search, gradeId, active]);

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const parentTopicOptions = useCallback((search) =>
    fetchTopics(subjectId, { page: 1, perPage: 20, search, gradeId: form.gradeId, active: "true" }).then((response) =>
      (response.data || []).map((topic) => ({
        value: topic.id,
        label: `${topic.name || topic.code}${topic.code ? ` (${topic.code})` : ""}`,
      }))
    ), [form.gradeId, subjectId]);

  const setFormGrade = (value) => {
    setForm((current) => ({ ...current, gradeId: value, parentTopicId: "" }));
    setParentTopicLabel("");
  };

  const setParentTopic = (value, label) => {
    setForm((current) => ({ ...current, parentTopicId: value }));
    setParentTopicLabel(label);
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!form.nameAz.trim()) return;

    setIsSubmitting(true);
    setError("");
    try {
      await createTopic({
        subjectId: Number(subjectId),
        nameAz: form.nameAz.trim(),
        code: form.code.trim() || undefined,
        gradeId: form.gradeId ? Number(form.gradeId) : undefined,
        parentTopicId: form.parentTopicId ? Number(form.parentTopicId) : undefined,
      });
      setForm({ nameAz: "", code: "", gradeId: "", parentTopicId: "" });
      setParentTopicLabel("");
      await loadTopics(1);
    } catch {
      setError("Topic could not be created.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const editTopic = async (topic) => {
    const nameAz = window.prompt("Topic name", topic.nameAz || topic.name || "");
    if (nameAz === null || !nameAz.trim()) return;

    try {
      await updateTopic(topic.id, {
        nameAz: nameAz.trim(),
        code: topic.code || undefined,
        gradeId: topic.gradeId || undefined,
        parentTopicId: topic.parentTopicId || undefined,
      });
      await loadTopics(meta.page);
    } catch {
      setError("Topic could not be updated.");
    }
  };

  const setTopicActive = async (topic) => {
    try {
      await (topic.active ? deactivateTopic(topic.id) : activateTopic(topic.id));
      await loadTopics(meta.page);
    } catch {
      setError("Topic status could not be updated.");
    }
  };

  const actionsFor = (topic) => [
    { label: "Edit", href: `/admin/courses/${subjectId}/topics/${topic.id}/edit`, icon: "ph ph-pencil-simple" },
    { label: "Quick edit", icon: "ph ph-text-aa", onClick: () => editTopic(topic) },
    {
      label: topic.active ? "Deactivate" : "Activate",
      icon: topic.active ? "ph ph-eye-slash" : "ph ph-eye",
      danger: topic.active,
      onClick: () => setTopicActive(topic),
    },
  ];

  return (
    <div className='px-24 py-24'>
      <div className='bg-white rounded-10 px-24 py-24'>
        <div className='d-flex flex-wrap align-items-center justify-content-between gap-16 mb-24'>
          <div>
            <h4 className='fw-semibold text-neutral-500 text-20 mb-4'>Topics</h4>
            <p className='text-14 text-neutral-400 mb-0'>Subject ID: {subjectId}</p>
          </div>
          <div className='d-flex flex-wrap align-items-center gap-8'>
            <Link href={`/admin/courses/${subjectId}/topics/new`} className='btn btn-main rounded-pill px-20'>Create Topic</Link>
            <AdminRefreshButton isLoading={isLoading} onClick={() => loadTopics(meta.page)} />
          </div>
        </div>

        <form className='d-flex flex-wrap align-items-center gap-12 mb-24' onSubmit={handleCreate}>
          <input name='nameAz' className='common-input rounded-pill flex-grow-1 min-w-220-px' placeholder='Topic name' value={form.nameAz} onChange={handleFormChange} />
          <input name='code' className='common-input rounded-pill min-w-140-px' placeholder='Code' value={form.code} onChange={handleFormChange} />
          <AdminGradeSelect value={form.gradeId} onChange={setFormGrade} minWidthClass='min-w-140-px' />
          <AdminSearchSelect
            value={form.parentTopicId}
            selectedLabel={parentTopicLabel}
            placeholder='Search parent topics...'
            loadOptions={parentTopicOptions}
            onChange={setParentTopic}
            minWidthClass='min-w-220-px'
          />
          <button type='submit' className='btn btn-main rounded-pill px-24' disabled={isSubmitting}>{isSubmitting ? "Creating..." : "Create"}</button>
        </form>

        <div className='d-flex flex-wrap align-items-center gap-12 mb-24'>
          <input className='common-input rounded-pill flex-grow-1 min-w-220-px' placeholder='Search topics...' value={search} onChange={(event) => setSearch(event.target.value)} />
          <AdminGradeSelect value={gradeId} onChange={setGradeId} minWidthClass='min-w-140-px' />
          <select className='form-select rounded-pill border-neutral-40 text-14 py-11 px-16 w-auto min-w-160-px' value={active} onChange={(event) => setActive(event.target.value)}>
            <option value=''>All statuses</option>
            <option value='true'>Active</option>
            <option value='false'>Inactive</option>
          </select>
        </div>

        {error ? <p className='text-danger mb-16'>{error}</p> : null}

        <div className='table-responsive admin-users-table'>
          <table className='table mb-0'>
            <thead>
              <tr>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Topic</th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Code</th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Grade</th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Status</th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20 text-end'>Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td className='py-20 px-20 text-neutral-400' colSpan='5'>Loading...</td></tr>
              ) : topics.length ? (
                topics.map((topic) => (
                  <tr key={topic.id}>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{topic.name}</td>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{topic.code || "-"}</td>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{topic.gradeId || "-"}</td>
                    <td className='py-16 px-20'><AdminStatusBadge status={topic.status} /></td>
                    <td className='py-16 px-20'><div className='d-flex justify-content-end'><AdminRowActions items={actionsFor(topic)} /></div></td>
                  </tr>
                ))
              ) : (
                <tr><td className='py-20 px-20 text-neutral-400' colSpan='5'>No topics found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className='d-flex align-items-center justify-content-end gap-8 mt-24'>
          <button type='button' className='px-14 py-8 border border-neutral-40 rounded-8 text-14 text-neutral-500' disabled={meta.page <= 1} onClick={() => loadTopics(Math.max(meta.page - 1, 1))}>Previous</button>
          <span className='text-14 text-neutral-400'>{meta.page} / {meta.totalPages}</span>
          <button type='button' className='px-14 py-8 border border-neutral-40 rounded-8 text-14 text-neutral-500' disabled={meta.page >= meta.totalPages} onClick={() => loadTopics(Math.min(meta.page + 1, meta.totalPages))}>Next</button>
        </div>
      </div>
    </div>
  );
};

export default AdminTopicsPage;
