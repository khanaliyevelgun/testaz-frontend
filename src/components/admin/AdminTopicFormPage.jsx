"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import AdminGradeSelect from "@/components/admin/AdminGradeSelect";
import AdminSearchSelect from "@/components/admin/AdminSearchSelect";
import { createTopic, fetchSubject, fetchSubjects, fetchTopic, fetchTopics, updateTopic } from "@/lib/api";
import StaticText from "@/components/StaticText";
import AdminCardSkeleton from "@/components/admin/AdminCardSkeleton";


const emptyForm = {
  subjectId: "",
  gradeId: "",
  parentTopicId: "",
  code: "",
  nameAz: "",
};

const AdminTopicFormPage = ({ subjectId, topicId }) => {
  const router = useRouter();
  const isEdit = Boolean(topicId);
  const [form, setForm] = useState({ ...emptyForm, subjectId: subjectId || "" });
  const [subjectLabel, setSubjectLabel] = useState("");
  const [parentTopicLabel, setParentTopicLabel] = useState("");
  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!subjectId) return;

    let isMounted = true;
    fetchSubject(subjectId)
      .then((subject) => {
        if (isMounted) setSubjectLabel(`${subject.name || subject.code} (${subject.code})`);
      })
      .catch(() => {
        if (isMounted) setSubjectLabel(`#${subjectId}`);
      });

    return () => {
      isMounted = false;
    };
  }, [subjectId]);

  useEffect(() => {
    if (!isEdit) return;

    let isMounted = true;
    setIsLoading(true);
    fetchTopic(topicId)
      .then((topic) => {
        if (!isMounted) return;
        setForm({
          subjectId: String(topic.subjectId || subjectId || ""),
          gradeId: topic.gradeId ? String(topic.gradeId) : "",
          parentTopicId: topic.parentTopicId ? String(topic.parentTopicId) : "",
          code: topic.code || "",
          nameAz: topic.nameAz || topic.name || "",
        });
        if (topic.subjectId || subjectId) {
          fetchSubject(topic.subjectId || subjectId)
            .then((subject) => {
              if (isMounted) setSubjectLabel(`${subject.name || subject.code} (${subject.code})`);
            })
            .catch(() => {
              if (isMounted) setSubjectLabel(`#${topic.subjectId || subjectId}`);
            });
        }
        if (topic.parentTopicId) {
          fetchTopic(topic.parentTopicId)
            .then((parentTopic) => {
              if (isMounted) setParentTopicLabel(`${parentTopic.name || parentTopic.code}${parentTopic.code ? ` (${parentTopic.code})` : ""}`);
            })
            .catch(() => {
              if (isMounted) setParentTopicLabel(`#${topic.parentTopicId}`);
            });
        }
      })
      .catch(() => {
        if (isMounted) setError("Mövzu yüklənmədi.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isEdit, subjectId, topicId]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const toOptionalNumber = (value) => (value === "" ? undefined : Number(value));

  const subjectOptions = useCallback((search) =>
    fetchSubjects({ page: 1, perPage: 20, search, active: "true" }).then((response) =>
      (response.data || []).map((subject) => ({
        value: subject.id,
        label: `${subject.name || subject.code} (${subject.code})`,
      }))
    ), []);

  const parentTopicOptions = useCallback((search) => {
    if (!form.subjectId) return Promise.resolve([]);
    return fetchTopics(form.subjectId, { page: 1, perPage: 20, search, gradeId: form.gradeId, active: "true" }).then((response) =>
      (response.data || [])
        .filter((topic) => String(topic.id) !== String(topicId || ""))
        .map((topic) => ({
          value: topic.id,
          label: `${topic.name || topic.code}${topic.code ? ` (${topic.code})` : ""}`,
        }))
    );
  }, [form.gradeId, form.subjectId, topicId]);

  const setSubject = (value, label) => {
    setForm((current) => ({ ...current, subjectId: value, parentTopicId: "" }));
    setSubjectLabel(label);
    setParentTopicLabel("");
  };

  const setGrade = (value) => {
    setForm((current) => ({ ...current, gradeId: value, parentTopicId: "" }));
    setParentTopicLabel("");
  };

  const setParentTopic = (value, label) => {
    setForm((current) => ({ ...current, parentTopicId: value }));
    setParentTopicLabel(label);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const payload = {
        gradeId: toOptionalNumber(form.gradeId),
        parentTopicId: toOptionalNumber(form.parentTopicId),
        code: form.code.trim() || undefined,
        nameAz: form.nameAz.trim(),
      };

      if (isEdit) {
        await updateTopic(topicId, payload);
      } else {
        await createTopic({
          ...payload,
          subjectId: Number(form.subjectId),
        });
      }

      router.push(`/admin/courses/${form.subjectId}/topics`);
      router.refresh();
    } catch {
      setError(isEdit ? "Mövzu yenilənmədi." : "Mövzu yaradılmadı.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='px-24 py-24'>
      <div className='bg-white rounded-10 px-24 py-24'>
        <div className='mb-24'>
          <h4 className='fw-semibold text-neutral-500 text-20 mb-4'>{isEdit ? <StaticText text={"Edit Topic"} /> : <StaticText text={"Create Topic"} />}</h4>
          <p className='text-14 text-neutral-400 mb-0'>{isEdit ? <StaticText text={"Update topic metadata."} /> : <StaticText text={"Create a topic under a subject."} />}</p>
        </div>

        {error ? <p className='text-danger mb-16'>{error}</p> : null}
        {isLoading ? (
          <AdminCardSkeleton rows={4} />
        ) : (
          <form className='row gy-4' onSubmit={handleSubmit}>
            <div className='col-md-4'>
              <AdminSearchSelect
                label='Subject'
                value={form.subjectId}
                selectedLabel={subjectLabel}
                placeholder='Fənlər üzrə axtar...'
                disabled={isEdit || Boolean(subjectId)}
                required
                loadOptions={subjectOptions}
                onChange={setSubject}
              />
            </div>
            <div className='col-md-4'>
              <label className='text-14 text-neutral-500 fw-medium mb-8'><StaticText text={"Name AZ"} /></label>
              <input name='nameAz' className='common-input rounded-pill' value={form.nameAz} onChange={handleChange} required />
            </div>
            <div className='col-md-4'>
              <label className='text-14 text-neutral-500 fw-medium mb-8'><StaticText text={"Code"} /></label>
              <input name='code' className='common-input rounded-pill' value={form.code} onChange={handleChange} />
            </div>
            <div className='col-md-4'>
              <AdminGradeSelect label='Grade' value={form.gradeId} onChange={setGrade} />
            </div>
            <div className='col-md-4'>
              <AdminSearchSelect
                label='Parent Topic'
                value={form.parentTopicId}
                selectedLabel={parentTopicLabel}
                placeholder={form.subjectId ? "Search parent topics..." : "Select subject first"}
                disabled={!form.subjectId}
                loadOptions={parentTopicOptions}
                onChange={setParentTopic}
              />
            </div>
            <div className='col-12 d-flex align-items-center gap-12 mt-24'>
              <button type='submit' className='btn btn-main rounded-pill px-24' disabled={isSubmitting}>{isSubmitting ? <StaticText text={"Saving..."} /> : <StaticText text={"Save"} />}</button>
              <button type='button' className='px-18 py-10 border border-neutral-40 rounded-pill text-14 text-neutral-500 bg-white' onClick={() => router.push(`/admin/courses/${form.subjectId || subjectId}/topics`)}><StaticText text={"Cancel"} /></button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AdminTopicFormPage;
