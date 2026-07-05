"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import AdminSearchSelect from "@/components/admin/AdminSearchSelect";
import { createExam, fetchExamTemplate, fetchSubjects, fetchTopics, saveExamTemplate } from "@/lib/api";

const visibilityOptions = [
  { value: "PRIVATE", label: "Private" },
  { value: "PUBLIC", label: "Public link" },
  { value: "ASSIGNED", label: "Assigned users" },
];

const typeFilters = [
  { value: "MIXED", label: "Mixed" },
  { value: "SINGLE_CHOICE", label: "Single choice" },
  { value: "MULTIPLE_CHOICE", label: "Multiple choice" },
  { value: "OPEN", label: "Open" },
];

const difficultyFilters = [
  { value: "MIXED", label: "Mixed" },
  { value: "EASY", label: "Easy" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HARD", label: "Hard" },
];

const emptyTopicBucket = () => ({
  topicId: "",
  topicLabel: "",
  questionCount: 10,
});

const emptySection = () => ({
  title: "",
  subjectId: "",
  subjectLabel: "",
  typeFilter: "MIXED",
  difficultyFilter: "MIXED",
  pointsCorrect: 1,
  penaltyWrong: 0,
  topics: [emptyTopicBucket()],
});

const sectionFromConfig = (section = {}) => ({
  title: section.title || "",
  subjectId: section.subjectId ? String(section.subjectId) : "",
  subjectLabel: section.subjectId ? `#${section.subjectId}` : "",
  typeFilter: section.typeFilter || "MIXED",
  difficultyFilter: section.difficultyFilter || "MIXED",
  pointsCorrect: section.pointsCorrect ?? 1,
  penaltyWrong: section.penaltyWrong ?? 0,
  topics: section.topics?.length
    ? section.topics.map((topic) => ({
        topicId: topic.topicId ? String(topic.topicId) : "",
        topicLabel: topic.topicId ? `#${topic.topicId}` : "",
        questionCount: topic.questionCount || 10,
      }))
    : [emptyTopicBucket()],
});

const normalizePositiveInt = (value) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue > 0 ? Math.floor(numberValue) : 0;
};

const normalizeNonNegativeNumber = (value) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue >= 0 ? numberValue : 0;
};

const formatShareLink = (shareLink) => {
  if (!shareLink) return "";
  if (/^https?:\/\//i.test(shareLink)) return shareLink;
  if (typeof window === "undefined") return shareLink;
  return `${window.location.origin}${shareLink.startsWith("/") ? "" : "/"}${shareLink}`;
};

const AdminExamFormPage = () => {
  const searchParams = useSearchParams();
  const templateId = searchParams.get("templateId");
  const [form, setForm] = useState({
    title: "",
    description: "",
    durationMinutes: 60,
    visibility: "PUBLIC",
    assignedUserIds: "",
  });
  const [sections, setSections] = useState([emptySection()]);
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateNotice, setTemplateNotice] = useState("");
  const [error, setError] = useState("");
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(Boolean(templateId));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdExam, setCreatedExam] = useState(null);
  const [copyStatus, setCopyStatus] = useState("");

  const totalQuestionCount = useMemo(
    () =>
      sections.reduce(
        (sectionTotal, section) =>
          sectionTotal +
          section.topics.reduce((topicTotal, topic) => topicTotal + normalizePositiveInt(topic.questionCount), 0),
        0
      ),
    [sections]
  );

  const subjectOptions = useCallback((search) =>
    fetchSubjects({ page: 1, perPage: 20, search, active: "true" }).then((response) =>
      (response.data || []).map((subject) => ({
        value: subject.id,
        label: `${subject.name || subject.code} (${subject.code})`,
      }))
    ), []);

  useEffect(() => {
    if (!templateId) return;

    let isMounted = true;
    setIsLoadingTemplate(true);
    setError("");
    fetchExamTemplate(templateId)
      .then((template) => {
        if (!isMounted) return;
        const config = template?.config || {};
        setForm({
          title: config.title || "",
          description: config.description || "",
          durationMinutes: config.durationMinutes || "",
          visibility: config.visibility || "PUBLIC",
          assignedUserIds: Array.isArray(config.assignedUserIds) ? config.assignedUserIds.join("\n") : "",
        });
        setSections(config.sections?.length ? config.sections.map(sectionFromConfig) : [emptySection()]);
        setTemplateName(template?.name ? `${template.name} copy` : "");
        setTemplateNotice(template?.name ? `Template loaded: ${template.name}` : "Template loaded.");
      })
      .catch((requestError) => {
        if (isMounted) setError(requestError?.message || "Template could not be loaded.");
      })
      .finally(() => {
        if (isMounted) setIsLoadingTemplate(false);
      });

    return () => {
      isMounted = false;
    };
  }, [templateId]);

  const buildTopicOptions = useCallback(
    (sectionIndex) => (search) => {
      const section = sections[sectionIndex];
      if (!section?.subjectId) return Promise.resolve([]);

      return fetchTopics(section.subjectId, { page: 1, perPage: 20, search, active: "true" }).then((response) =>
        (response.data || []).map((topic) => ({
          value: topic.id,
          label: `${topic.name || topic.code}${topic.code ? ` (${topic.code})` : ""}`,
        }))
      );
    },
    [sections]
  );

  const updateForm = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const updateSection = (sectionIndex, patch) => {
    setSections((current) =>
      current.map((section, index) => (index === sectionIndex ? { ...section, ...patch } : section))
    );
  };

  const updateTopic = (sectionIndex, topicIndex, patch) => {
    setSections((current) =>
      current.map((section, index) =>
        index === sectionIndex
          ? {
              ...section,
              topics: section.topics.map((topic, innerIndex) =>
                innerIndex === topicIndex ? { ...topic, ...patch } : topic
              ),
            }
          : section
      )
    );
  };

  const setSubject = (sectionIndex, value, label) => {
    updateSection(sectionIndex, {
      subjectId: value,
      subjectLabel: label,
      topics: [emptyTopicBucket()],
    });
  };

  const addSection = () => {
    setSections((current) => (current.length >= 20 ? current : [...current, emptySection()]));
  };

  const removeSection = (sectionIndex) => {
    setSections((current) => current.filter((_, index) => index !== sectionIndex));
  };

  const addTopic = (sectionIndex) => {
    setSections((current) =>
      current.map((section, index) =>
        index === sectionIndex && section.topics.length < 50
          ? { ...section, topics: [...section.topics, emptyTopicBucket()] }
          : section
      )
    );
  };

  const removeTopic = (sectionIndex, topicIndex) => {
    setSections((current) =>
      current.map((section, index) =>
        index === sectionIndex
          ? { ...section, topics: section.topics.filter((_, innerIndex) => innerIndex !== topicIndex) }
          : section
      )
    );
  };

  const parseAssignedUserIds = () =>
    form.assignedUserIds
      .split(/[\s,;]+/)
      .map((item) => item.trim())
      .filter(Boolean);

  const validate = () => {
    if (!sections.length) return "At least one section is required.";
    if (form.durationMinutes && normalizePositiveInt(form.durationMinutes) > 600) {
      return "Duration cannot be more than 600 minutes.";
    }

    for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex += 1) {
      const section = sections[sectionIndex];
      if (!section.subjectId) return `Section ${sectionIndex + 1}: subject is required.`;
      if (!section.topics.length) return `Section ${sectionIndex + 1}: at least one topic bucket is required.`;
      if (!section.topics.some((topic) => normalizePositiveInt(topic.questionCount) > 0)) {
        return `Section ${sectionIndex + 1}: question count is required.`;
      }
    }

    if (form.visibility === "ASSIGNED" && !parseAssignedUserIds().length) {
      return "Assigned visibility requires at least one user id.";
    }

    return "";
  };

  const buildPayload = () => ({
    title: form.title.trim(),
    description: form.description.trim(),
    durationMinutes: normalizePositiveInt(form.durationMinutes) || undefined,
    visibility: form.visibility,
    assignedUserIds: form.visibility === "ASSIGNED" ? parseAssignedUserIds() : [],
    sections: sections.map((section, sectionIndex) => ({
      title: section.title.trim() || section.subjectLabel || `Section ${sectionIndex + 1}`,
      subjectId: Number(section.subjectId),
      typeFilter: section.typeFilter,
      difficultyFilter: section.difficultyFilter,
      pointsCorrect: normalizeNonNegativeNumber(section.pointsCorrect) || 1,
      penaltyWrong: normalizeNonNegativeNumber(section.penaltyWrong),
      topics: section.topics
        .map((topic) => ({
          topicId: topic.topicId ? Number(topic.topicId) : null,
          questionCount: normalizePositiveInt(topic.questionCount),
        }))
        .filter((topic) => topic.questionCount > 0),
    })),
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError("");
    setCopyStatus("");
    try {
      const payload = buildPayload();
      if (saveAsTemplate) {
        if (!templateName.trim()) {
          setError("Template name is required.");
          setIsSubmitting(false);
          return;
        }
        await saveExamTemplate({ name: templateName.trim(), config: payload });
      }
      const result = await createExam(payload);
      setCreatedExam(result);
    } catch (requestError) {
      setError(requestError?.message || "Exam could not be created.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyLink = async () => {
    const link = formatShareLink(createdExam?.shareLink);
    if (!link) return;

    try {
      await navigator.clipboard.writeText(link);
      setCopyStatus("Copied");
    } catch {
      setCopyStatus("Select the link and copy manually");
    }
  };

  return (
    <div className='px-24 py-24'>
      <div className='bg-white rounded-10 px-24 py-24'>
        <div className='d-flex flex-wrap align-items-start justify-content-between gap-16 mb-24'>
          <div>
            <h4 className='fw-semibold text-neutral-500 text-20 mb-4'>Yeni imtahan yarat</h4>
            <p className='text-14 text-neutral-400 mb-0'>Bölmələri, sual saylarını və paylaşım linkini burada hazırla.</p>
          </div>
          <div className='px-16 py-10 rounded-12 bg-main-25 text-14 text-neutral-500'>
            Ümumi sual: <span className='fw-semibold'>{totalQuestionCount}</span>
          </div>
        </div>

        {templateNotice ? <div className='alert alert-info text-14 py-10 mb-20'>{templateNotice}</div> : null}
        {error ? <div className='alert alert-danger text-14 py-10 mb-20'>{error}</div> : null}

        {isLoadingTemplate ? (
          <p className='text-14 text-neutral-400 mb-0'>Template loading...</p>
        ) : (
        <form className='row gy-4' onSubmit={handleSubmit} noValidate>
          <div className='col-md-6'>
            <label className='text-14 text-neutral-500 fw-medium mb-8'>Başlıq</label>
            <input
              name='title'
              className='common-input rounded-pill'
              maxLength='200'
              value={form.title}
              onChange={updateForm}
              placeholder='Məsələn: 9-cu sinif sınaq imtahanı'
            />
          </div>
          <div className='col-md-3'>
            <label className='text-14 text-neutral-500 fw-medium mb-8'>Müddət (dəqiqə)</label>
            <input
              name='durationMinutes'
              type='number'
              min='0'
              max='600'
              className='common-input rounded-pill'
              value={form.durationMinutes}
              onChange={updateForm}
            />
          </div>
          <div className='col-md-3'>
            <label className='text-14 text-neutral-500 fw-medium mb-8'>Görünürlük</label>
            <select
              name='visibility'
              className='form-select rounded-pill border-neutral-40 text-14 py-11 px-16'
              value={form.visibility}
              onChange={updateForm}
            >
              {visibilityOptions.map((option) => (
                <option value={option.value} key={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div className='col-12'>
            <label className='text-14 text-neutral-500 fw-medium mb-8'>Açıqlama</label>
            <textarea
              name='description'
              className='common-input rounded-12'
              rows='3'
              maxLength='2000'
              value={form.description}
              onChange={updateForm}
            />
          </div>

          {form.visibility === "ASSIGNED" ? (
            <div className='col-12'>
              <label className='text-14 text-neutral-500 fw-medium mb-8'>Assigned user IDs</label>
              <textarea
                name='assignedUserIds'
                className='common-input rounded-12'
                rows='3'
                value={form.assignedUserIds}
                onChange={updateForm}
                placeholder='UUID dəyərlərini vergül, boşluq və ya yeni sətirlə ayır'
              />
            </div>
          ) : null}

          <div className='col-12 mt-16'>
            <div className='d-flex align-items-center justify-content-between gap-12 mb-12'>
              <h5 className='text-16 fw-semibold text-neutral-500 mb-0'>Bölmələr</h5>
              <button type='button' className='px-14 py-8 border border-neutral-40 rounded-pill text-14 text-neutral-500 bg-white' onClick={addSection} disabled={sections.length >= 20}>
                Bölmə əlavə et
              </button>
            </div>

            <div className='d-flex flex-column gap-16'>
              {sections.map((section, sectionIndex) => (
                <div className='border border-neutral-30 rounded-12 p-16' key={sectionIndex}>
                  <div className='d-flex flex-wrap align-items-center justify-content-between gap-12 mb-16'>
                    <h6 className='text-15 fw-semibold text-neutral-500 mb-0'>Bölmə {sectionIndex + 1}</h6>
                    <button
                      type='button'
                      className='px-12 py-8 border border-neutral-40 rounded-pill text-14 text-neutral-500 bg-white'
                      onClick={() => removeSection(sectionIndex)}
                      disabled={sections.length <= 1}
                    >
                      Sil
                    </button>
                  </div>

                  <div className='row gy-3'>
                    <div className='col-md-4'>
                      <label className='text-14 text-neutral-500 fw-medium mb-8'>Bölmə adı</label>
                      <input
                        className='common-input rounded-pill'
                        maxLength='200'
                        value={section.title}
                        onChange={(event) => updateSection(sectionIndex, { title: event.target.value })}
                        placeholder='Opsional'
                      />
                    </div>
                    <div className='col-md-4'>
                      <AdminSearchSelect
                        label='Fənn'
                        value={section.subjectId}
                        selectedLabel={section.subjectLabel}
                        placeholder='Fənn axtar...'
                        required
                        loadOptions={subjectOptions}
                        loadingText='Yüklənir...'
                        emptyText='Nəticə tapılmadı.'
                        onChange={(value, label) => setSubject(sectionIndex, value, label)}
                      />
                    </div>
                    <div className='col-md-2'>
                      <label className='text-14 text-neutral-500 fw-medium mb-8'>Sual növü</label>
                      <select
                        className='form-select rounded-pill border-neutral-40 text-14 py-11 px-16'
                        value={section.typeFilter}
                        onChange={(event) => updateSection(sectionIndex, { typeFilter: event.target.value })}
                      >
                        {typeFilters.map((option) => (
                          <option value={option.value} key={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className='col-md-2'>
                      <label className='text-14 text-neutral-500 fw-medium mb-8'>Çətinlik</label>
                      <select
                        className='form-select rounded-pill border-neutral-40 text-14 py-11 px-16'
                        value={section.difficultyFilter}
                        onChange={(event) => updateSection(sectionIndex, { difficultyFilter: event.target.value })}
                      >
                        {difficultyFilters.map((option) => (
                          <option value={option.value} key={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className='col-md-2'>
                      <label className='text-14 text-neutral-500 fw-medium mb-8'>Doğru balı</label>
                      <input
                        type='number'
                        min='0'
                        step='0.25'
                        className='common-input rounded-pill'
                        value={section.pointsCorrect}
                        onChange={(event) => updateSection(sectionIndex, { pointsCorrect: event.target.value })}
                      />
                    </div>
                    <div className='col-md-2'>
                      <label className='text-14 text-neutral-500 fw-medium mb-8'>Səhv cəriməsi</label>
                      <input
                        type='number'
                        min='0'
                        step='0.25'
                        className='common-input rounded-pill'
                        value={section.penaltyWrong}
                        onChange={(event) => updateSection(sectionIndex, { penaltyWrong: event.target.value })}
                      />
                    </div>
                  </div>

                  <div className='mt-16'>
                    <div className='d-flex align-items-center justify-content-between gap-12 mb-12'>
                      <span className='text-14 fw-medium text-neutral-500'>Topic buckets</span>
                      <button
                        type='button'
                        className='px-12 py-8 border border-neutral-40 rounded-pill text-14 text-neutral-500 bg-white'
                        onClick={() => addTopic(sectionIndex)}
                        disabled={section.topics.length >= 50}
                      >
                        Topic əlavə et
                      </button>
                    </div>
                    <div className='d-flex flex-column gap-12'>
                      {section.topics.map((topic, topicIndex) => (
                        <div className='row gy-2 align-items-end' key={topicIndex}>
                          <div className='col-md-8'>
                            <AdminSearchSelect
                              label={topicIndex === 0 ? "Mövzu" : ""}
                              value={topic.topicId}
                              selectedLabel={topic.topicLabel}
                              placeholder={section.subjectId ? "Mövzu axtar... boş saxla = bütün mövzular" : "Əvvəl fənn seç"}
                              disabled={!section.subjectId}
                              loadOptions={buildTopicOptions(sectionIndex)}
                              loadingText='Yüklənir...'
                              emptyText='Nəticə tapılmadı.'
                              onChange={(value, label) => updateTopic(sectionIndex, topicIndex, { topicId: value, topicLabel: label })}
                            />
                          </div>
                          <div className='col-md-2'>
                            <label className='text-14 text-neutral-500 fw-medium mb-8'>{topicIndex === 0 ? "Sual sayı" : ""}</label>
                            <input
                              type='number'
                              min='1'
                              max='500'
                              className='common-input rounded-pill'
                              value={topic.questionCount}
                              onChange={(event) => updateTopic(sectionIndex, topicIndex, { questionCount: event.target.value })}
                            />
                          </div>
                          <div className='col-md-2'>
                            <button
                              type='button'
                              className='w-100 px-12 py-10 border border-neutral-40 rounded-pill text-14 text-neutral-500 bg-white'
                              onClick={() => removeTopic(sectionIndex, topicIndex)}
                              disabled={section.topics.length <= 1}
                            >
                              Sil
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className='col-12'>
            <div className='border border-neutral-30 rounded-12 p-16'>
              <label className='d-flex align-items-center gap-10 text-14 text-neutral-500 fw-medium mb-12'>
                <input
                  type='checkbox'
                  checked={saveAsTemplate}
                  onChange={(event) => setSaveAsTemplate(event.target.checked)}
                />
                Şablon kimi saxla
              </label>
              {saveAsTemplate ? (
                <input
                  className='common-input rounded-pill'
                  maxLength='200'
                  value={templateName}
                  onChange={(event) => setTemplateName(event.target.value)}
                  placeholder='Şablon adı'
                />
              ) : null}
            </div>
          </div>

          <div className='col-12 d-flex align-items-center gap-12 mt-24'>
            <button type='submit' className='btn btn-main rounded-pill px-24' disabled={isSubmitting}>
              {isSubmitting ? "Yaradılır..." : "İmtahan yarat"}
            </button>
          </div>
        </form>
        )}
      </div>

      {createdExam ? (
        <div className='modal fade show d-block' tabIndex='-1' role='dialog' style={{ background: "rgba(15, 23, 42, 0.48)" }}>
          <div className='modal-dialog modal-dialog-centered modal-lg' role='document'>
            <div className='modal-content rounded-12 border-0'>
              <div className='modal-header border-neutral-30'>
                <div>
                  <h5 className='modal-title text-18 fw-semibold text-neutral-500'>İmtahan yaradıldı</h5>
                  <p className='text-14 text-neutral-400 mb-0'>Nəticələr və paylaşım linki aşağıdadır.</p>
                </div>
                <button type='button' className='btn-close' aria-label='Close' onClick={() => setCreatedExam(null)}></button>
              </div>
              <div className='modal-body'>
                <div className='row gy-3 mb-20'>
                  <div className='col-md-6'>
                    <div className='border border-neutral-30 rounded-12 p-14'>
                      <span className='text-13 text-neutral-400 d-block mb-4'>Başlıq</span>
                      <strong className='text-15 text-neutral-500'>{createdExam.title || "-"}</strong>
                    </div>
                  </div>
                  <div className='col-md-3'>
                    <div className='border border-neutral-30 rounded-12 p-14'>
                      <span className='text-13 text-neutral-400 d-block mb-4'>Bölmə</span>
                      <strong className='text-15 text-neutral-500'>{createdExam.sectionCount ?? "-"}</strong>
                    </div>
                  </div>
                  <div className='col-md-3'>
                    <div className='border border-neutral-30 rounded-12 p-14'>
                      <span className='text-13 text-neutral-400 d-block mb-4'>Sual</span>
                      <strong className='text-15 text-neutral-500'>{createdExam.totalQuestions ?? "-"}</strong>
                    </div>
                  </div>
                  <div className='col-md-4'>
                    <div className='border border-neutral-30 rounded-12 p-14'>
                      <span className='text-13 text-neutral-400 d-block mb-4'>Maksimum bal</span>
                      <strong className='text-15 text-neutral-500'>{createdExam.totalMaxScore ?? "-"}</strong>
                    </div>
                  </div>
                  <div className='col-md-4'>
                    <div className='border border-neutral-30 rounded-12 p-14'>
                      <span className='text-13 text-neutral-400 d-block mb-4'>Müddət</span>
                      <strong className='text-15 text-neutral-500'>{createdExam.durationMinutes ? `${createdExam.durationMinutes} dəq.` : "Limitsiz"}</strong>
                    </div>
                  </div>
                  <div className='col-md-4'>
                    <div className='border border-neutral-30 rounded-12 p-14'>
                      <span className='text-13 text-neutral-400 d-block mb-4'>Görünürlük</span>
                      <strong className='text-15 text-neutral-500'>{createdExam.visibility || "-"}</strong>
                    </div>
                  </div>
                </div>

                <label className='text-14 text-neutral-500 fw-medium mb-8'>Paylaşım linki</label>
                <div className='d-flex flex-wrap align-items-center gap-10'>
                  <input className='common-input rounded-pill flex-grow-1 min-w-240-px' readOnly value={formatShareLink(createdExam.shareLink)} onFocus={(event) => event.target.select()} />
                  <button type='button' className='btn btn-main rounded-pill px-20' onClick={copyLink}>
                    Kopyala
                  </button>
                </div>
                {copyStatus ? <p className='text-14 text-neutral-400 mt-8 mb-0'>{copyStatus}</p> : null}
                <p className='text-13 text-neutral-400 mt-12 mb-0'>Exam ID: {createdExam.examId || "-"}</p>
              </div>
              <div className='modal-footer border-neutral-30'>
                <button type='button' className='px-18 py-10 border border-neutral-40 rounded-pill text-14 text-neutral-500 bg-white' onClick={() => setCreatedExam(null)}>
                  Bağla
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AdminExamFormPage;
