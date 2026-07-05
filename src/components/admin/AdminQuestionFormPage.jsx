"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import AdminGradeSelect from "@/components/admin/AdminGradeSelect";
import AdminRichTextEditor from "@/components/admin/AdminRichTextEditor";
import AdminSearchSelect from "@/components/admin/AdminSearchSelect";
import { createAdminQuestion, fetchAdminQuestion, fetchSubject, fetchSubjects, fetchTopic, fetchTopics, getApiAssetUrl, updateAdminQuestion, uploadAdminMedia } from "@/lib/api";
import { getQuestionImageSrc, isImageOnlyQuestionHtml } from "@/lib/questionContent";

const difficulties = ["EASY", "MEDIUM", "HARD"];
const questionTypes = ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "SHORT_TEXT"];
const matchTypes = ["EXACT", "NORMALIZED", "NUMERIC", "REGEX"];
const questionTypeLabels = {
  SINGLE_CHOICE: "Tək seçim",
  MULTIPLE_CHOICE: "Çox seçim",
  SHORT_TEXT: "Qısa cavab",
};
const difficultyLabels = {
  EASY: "Asan",
  MEDIUM: "Orta",
  HARD: "Çətin",
};
const matchTypeLabels = {
  EXACT: "Dəqiq",
  NORMALIZED: "Normallaşdırılmış",
  NUMERIC: "Rəqəm",
  REGEX: "Regex",
};

const emptyForm = {
  subjectId: "",
  gradeId: "",
  topicId: "",
  difficulty: "EASY",
  type: "SINGLE_CHOICE",
  stem: "",
  explanation: "",
  language: "az",
  mediaPath: "",
  mediaType: "",
};

const emptyOption = (orderIndex = 0) => ({ content: "", correct: false, orderIndex, mode: "text" });
const emptyAcceptedAnswer = (orderIndex = 0) => ({
  value: "",
  matchType: "EXACT",
  caseSensitive: false,
  orderIndex,
});

const toOptionalNumber = (value) => (value === "" ? undefined : Number(value));

const AdminQuestionFormPage = ({ questionId }) => {
  const router = useRouter();
  const isEdit = Boolean(questionId);
  const [form, setForm] = useState(emptyForm);
  const [options, setOptions] = useState([emptyOption(0), emptyOption(1), emptyOption(2), emptyOption(3)]);
  const [acceptedAnswers, setAcceptedAnswers] = useState([emptyAcceptedAnswer(0)]);
  const [subjectLabel, setSubjectLabel] = useState("");
  const [topicLabel, setTopicLabel] = useState("");
  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingField, setUploadingField] = useState("");
  const [, setError] = useState("");

  const usesOptions = useMemo(() => form.type === "SINGLE_CHOICE" || form.type === "MULTIPLE_CHOICE", [form.type]);
  const canSubmit = useMemo(() => {
    if (!form.stem.trim()) return false;
    if (!isEdit && !form.subjectId) return false;
    if (usesOptions) return options.some((option) => option.content.trim() && option.correct);
    return acceptedAnswers.some((answer) => answer.value.trim());
  }, [acceptedAnswers, form.stem, form.subjectId, isEdit, options, usesOptions]);

  const subjectOptions = useCallback((search) =>
    fetchSubjects({ page: 1, perPage: 20, search, active: "true" }).then((response) =>
      (response.data || []).map((subject) => ({
        value: subject.id,
        label: `${subject.name || subject.code} (${subject.code})`,
        subject,
      }))
    ), []);

  const topicOptions = useCallback((search) => {
    if (!form.subjectId) return Promise.resolve([]);
    return fetchTopics(form.subjectId, { page: 1, perPage: 20, search, gradeId: form.gradeId, active: "true" }).then((response) =>
      (response.data || []).map((topic) => ({
        value: topic.id,
        label: `${topic.name || topic.code}${topic.code ? ` (${topic.code})` : ""}`,
        topic,
      }))
    );
  }, [form.gradeId, form.subjectId]);

  useEffect(() => {
    if (!isEdit) return;

    let isMounted = true;
    setIsLoading(true);
    fetchAdminQuestion(questionId)
      .then((question) => {
        if (!isMounted) return;
        setForm({
          subjectId: question.subjectId ? String(question.subjectId) : "",
          gradeId: question.gradeId ? String(question.gradeId) : "",
          topicId: question.topicId ? String(question.topicId) : "",
          difficulty: question.difficulty || "EASY",
          type: question.type || "SINGLE_CHOICE",
          stem: question.stem || "",
          explanation: question.explanation || "",
          language: question.language || "az",
          mediaPath: question.mediaPath || "",
          mediaType: question.mediaType || "",
        });
        if (question.subjectId) {
          fetchSubject(question.subjectId)
            .then((subject) => {
              if (isMounted) setSubjectLabel(`${subject.name || subject.code} (${subject.code})`);
            })
            .catch(() => {
              if (isMounted) setSubjectLabel(`#${question.subjectId}`);
            });
        }
        if (question.topicId) {
          fetchTopic(question.topicId)
            .then((topic) => {
              if (isMounted) setTopicLabel(`${topic.name || topic.code}${topic.code ? ` (${topic.code})` : ""}`);
            })
            .catch(() => {
              if (isMounted) setTopicLabel(`#${question.topicId}`);
            });
        }
        setOptions(
          question.options?.length
            ? question.options.map((option, index) => ({
                content: option.content || "",
                correct: Boolean(option.correct),
                orderIndex: option.orderIndex ?? index,
                mode: isImageOnlyQuestionHtml(option.content) ? "image" : "text",
              }))
            : [emptyOption(0), emptyOption(1)]
        );
        setAcceptedAnswers(
          question.acceptedAnswers?.length
            ? question.acceptedAnswers.map((answer, index) => ({
                value: answer.value || "",
                matchType: answer.matchType || "EXACT",
                caseSensitive: Boolean(answer.caseSensitive),
                orderIndex: answer.orderIndex ?? index,
              }))
            : [emptyAcceptedAnswer(0)]
        );
      })
      .catch(() => {
        if (isMounted) setError("Question could not be loaded.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isEdit, questionId]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    if (name === "type" && value === "SINGLE_CHOICE") {
      setOptions((current) => {
        const firstCorrectIndex = current.findIndex((option) => option.correct);
        return current.map((option, index) => ({ ...option, correct: index === firstCorrectIndex }));
      });
    }
  };

  const setSubject = (value, label) => {
    setForm((current) => ({ ...current, subjectId: value, topicId: "" }));
    setSubjectLabel(label);
    setTopicLabel("");
  };

  const setTopic = (value, label) => {
    setForm((current) => ({ ...current, topicId: value }));
    setTopicLabel(label);
  };

  const setGrade = (value) => {
    setForm((current) => ({ ...current, gradeId: value, topicId: "" }));
    setTopicLabel("");
  };

  const updateOption = (index, patch) => {
    setOptions((current) => current.map((option, optionIndex) => (optionIndex === index ? { ...option, ...patch } : option)));
  };

  const setCorrectOption = (index, checked) => {
    setOptions((current) =>
      current.map((option, optionIndex) => ({
        ...option,
        correct: form.type === "SINGLE_CHOICE" ? optionIndex === index : optionIndex === index ? checked : option.correct,
      }))
    );
  };

  const setOptionMode = (index, mode) => {
    updateOption(index, { mode, content: "" });
  };

  const uploadMediaFile = async (file, fieldLabel) => {
    if (!file) return null;
    if (!file.type.startsWith("image/")) {
      setError("Burada yalnız şəkil faylı yükləmək olar.");
      return null;
    }

    setUploadingField(fieldLabel);
    setError("");
    try {
      return await uploadAdminMedia(file);
    } catch (requestError) {
      setError(requestError?.message || "Şəkil yüklənmədi.");
      return null;
    } finally {
      setUploadingField("");
    }
  };

  const handleQuestionImageUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    const uploaded = await uploadMediaFile(file, "question");
    if (!uploaded?.path) return;

    setForm((current) => ({
      ...current,
      mediaPath: uploaded.path,
      mediaType: uploaded.contentType || file.type,
    }));
  };

  const handleOptionImageUpload = async (index, event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    const uploaded = await uploadMediaFile(file, `option-${index}`);
    if (!uploaded?.path) return;

    const imageHtml = `<img src="${getApiAssetUrl(uploaded.path)}" alt="Option ${index + 1}" />`;
    updateOption(index, {
      content: imageHtml,
      mode: "image",
    });
  };

  const handleStemImageUpload = async (file) => {
    const uploaded = await uploadMediaFile(file, "stem");
    if (!uploaded?.path) throw new Error("Şəkil yüklənmədi.");
    return getApiAssetUrl(uploaded.path);
  };

  const updateAcceptedAnswer = (index, patch) => {
    setAcceptedAnswers((current) => current.map((answer, answerIndex) => (answerIndex === index ? { ...answer, ...patch } : answer)));
  };

  const addOption = () => {
    setOptions((current) => (current.length >= 10 ? current : [...current, emptyOption(current.length)]));
  };

  const addAcceptedAnswer = () => {
    setAcceptedAnswers((current) => (current.length >= 10 ? current : [...current, emptyAcceptedAnswer(current.length)]));
  };

  const buildPayload = () => {
    const payload = {
      gradeId: toOptionalNumber(form.gradeId),
      topicId: toOptionalNumber(form.topicId),
      difficulty: form.difficulty,
      stem: form.stem.trim(),
      explanation: form.explanation.trim(),
      language: form.language.trim() || undefined,
      mediaPath: form.mediaPath.trim(),
      mediaType: form.mediaType.trim(),
      options: usesOptions
        ? options
            .map((option, index) => ({
              content: option.content.trim(),
              correct: Boolean(option.correct),
              orderIndex: index,
            }))
            .filter((option) => option.content)
        : [],
      acceptedAnswers: !usesOptions
        ? acceptedAnswers
            .map((answer, index) => ({
              value: answer.value.trim(),
              matchType: answer.matchType,
              caseSensitive: Boolean(answer.caseSensitive),
              orderIndex: index,
            }))
            .filter((answer) => answer.value)
        : [],
    };

    if (!isEdit) {
      payload.subjectId = Number(form.subjectId);
      payload.type = form.type;
    }

    return payload;
  };

  const validate = () => {
    if (!form.stem.trim()) return "Sual mətni tələb olunur.";
    if (!isEdit && !form.subjectId) return "Fənn seçilməlidir.";
    if (usesOptions && !options.some((option) => option.content.trim() && option.correct)) {
      return "Ən azı bir doğru variant seçilməlidir.";
    }
    if (!usesOptions && !acceptedAnswers.some((answer) => answer.value.trim())) {
      return "Ən azı bir qəbul edilən cavab yazılmalıdır.";
    }
    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      if (isEdit) {
        await updateAdminQuestion(questionId, buildPayload());
      } else {
        await createAdminQuestion(buildPayload());
      }
      router.push("/admin/questions");
      router.refresh();
    } catch (requestError) {
      setError(requestError?.message || (isEdit ? "Sual yenilənmədi." : "Sual yaradılmadı."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='px-24 py-24'>
      <div className='bg-white rounded-10 px-24 py-24'>
        <div className='mb-24'>
          <h4 className='fw-semibold text-neutral-500 text-20 mb-4'>{isEdit ? "Sualı Redaktə Et" : "Sual Yarat"}</h4>
          <p className='text-14 text-neutral-400 mb-0'>{isEdit ? "Məzmunu, məlumatları, variantları və qəbul edilən cavabları yenilə." : "Yeni qaralama sual yarat."}</p>
        </div>

        {isLoading ? (
          <p className='text-14 text-neutral-400 mb-0'>Yüklənir...</p>
        ) : (
          <form className='row gy-4' onSubmit={handleSubmit} noValidate>
            <div className='col-md-3'>
              <AdminSearchSelect
                label='Fənn'
                value={form.subjectId}
                selectedLabel={subjectLabel}
                placeholder='Fənn axtar...'
                disabled={isEdit}
                required={!isEdit}
                loadOptions={subjectOptions}
                loadingText='Yüklənir...'
                emptyText='Nəticə tapılmadı.'
                onChange={setSubject}
              />
            </div>
            <div className='col-md-3'>
              <AdminGradeSelect label='Sinif' value={form.gradeId} onChange={setGrade} placeholder='Sinif' />
            </div>
            <div className='col-md-3'>
              <AdminSearchSelect
                label='Mövzu'
                value={form.topicId}
                selectedLabel={topicLabel}
                placeholder={form.subjectId ? "Mövzu axtar..." : "Əvvəl fənn seç"}
                disabled={!form.subjectId}
                loadOptions={topicOptions}
                loadingText='Yüklənir...'
                emptyText='Nəticə tapılmadı.'
                onChange={setTopic}
              />
            </div>
            <div className='col-md-3'>
              <label className='text-14 text-neutral-500 fw-medium mb-8'>Dil</label>
              <input name='language' className='common-input rounded-pill' maxLength='2' value={form.language} onChange={handleChange} />
            </div>

            <div className='col-md-4'>
              <label className='text-14 text-neutral-500 fw-medium mb-8'>Çətinlik</label>
              <select name='difficulty' className='form-select rounded-pill border-neutral-40 text-14 py-11 px-16' value={form.difficulty} onChange={handleChange}>
                {difficulties.map((difficulty) => <option value={difficulty} key={difficulty}>{difficultyLabels[difficulty]}</option>)}
              </select>
            </div>
            <div className='col-md-4'>
              <label className='text-14 text-neutral-500 fw-medium mb-8'>Sual növü</label>
              <select name='type' className='form-select rounded-pill border-neutral-40 text-14 py-11 px-16' value={form.type} onChange={handleChange} disabled={isEdit}>
                {questionTypes.map((type) => <option value={type} key={type}>{questionTypeLabels[type]}</option>)}
              </select>
            </div>
            <div className='col-12'>
              <label className='text-14 text-neutral-500 fw-medium mb-8'>Sual mətni</label>
              <AdminRichTextEditor value={form.stem} onChange={(stem) => setForm((current) => ({ ...current, stem }))} onUpload={handleStemImageUpload} />
              {uploadingField === "stem" ? <p className='text-14 text-neutral-400 mt-8 mb-0'>Şəkil yüklənir...</p> : null}
            </div>
            <div className='col-12'>
              <label className='text-14 text-neutral-500 fw-medium mb-8'>Sual şəkli</label>
              <div className='d-flex flex-wrap align-items-center gap-12'>
                <input type='file' accept='image/*' className='common-input rounded-pill flex-grow-1 min-w-240-px' onChange={handleQuestionImageUpload} disabled={Boolean(uploadingField)} />
                {form.mediaPath ? <button type='button' className='px-14 py-10 border border-neutral-40 rounded-pill text-14 text-neutral-500 bg-white' onClick={() => setForm((current) => ({ ...current, mediaPath: "", mediaType: "" }))}>Şəkli sil</button> : null}
              </div>
              {uploadingField === "question" ? <p className='text-14 text-neutral-400 mt-8 mb-0'>Şəkil yüklənir...</p> : null}
              {form.mediaPath ? (
                <div className='mt-12'>
                  <img src={getApiAssetUrl(form.mediaPath)} alt='Sual şəkli' className='max-w-320-px w-100 rounded-12 border border-neutral-30' />
                </div>
              ) : null}
            </div>
            <div className='col-12'>
              <label className='text-14 text-neutral-500 fw-medium mb-8'>İzah</label>
              <textarea name='explanation' className='common-input rounded-12' rows='4' maxLength='4000' value={form.explanation} onChange={handleChange} />
            </div>

            {usesOptions ? (
              <div className='col-12'>
                <div className='d-flex align-items-center justify-content-between gap-12 mb-12'>
                  <h5 className='text-16 fw-semibold text-neutral-500 mb-0'>Variantlar</h5>
                  <button type='button' className='px-14 py-8 border border-neutral-40 rounded-pill text-14 text-neutral-500 bg-white' onClick={addOption} disabled={options.length >= 10}>Variant əlavə et</button>
                </div>
                <div className='d-flex flex-column gap-12'>
                  {options.map((option, index) => (
                    <div className='option-editor-row border border-neutral-30 rounded-12 p-12' key={index}>
                      <label className='option-correct-control text-14 text-neutral-500 mb-0'>
                        <input
                          type={form.type === "SINGLE_CHOICE" ? "radio" : "checkbox"}
                          name='correctOption'
                          checked={option.correct}
                          onChange={(event) => setCorrectOption(index, event.target.checked)}
                        />
                        Doğru
                      </label>
                      <div className='option-editor-body'>
                        <div className='d-flex flex-wrap align-items-center justify-content-between gap-12 mb-12'>
                          <span className='text-14 fw-medium text-neutral-500'>Variant {index + 1}</span>
                          <div className='d-flex flex-wrap align-items-center gap-8'>
                            <button type='button' className={`px-12 py-8 border rounded-pill text-14 ${option.mode !== "image" ? "btn-main text-white" : "border-neutral-40 text-neutral-500 bg-white"}`} onClick={() => setOptionMode(index, "text")}>Mətn</button>
                            <button type='button' className={`px-12 py-8 border rounded-pill text-14 ${option.mode === "image" ? "btn-main text-white" : "border-neutral-40 text-neutral-500 bg-white"}`} onClick={() => setOptionMode(index, "image")}>Şəkil</button>
                            <button type='button' className='px-12 py-8 border border-neutral-40 rounded-pill text-14 text-neutral-500 bg-white' onClick={() => setOptions((current) => current.filter((_, optionIndex) => optionIndex !== index))} disabled={options.length <= 1}>Sil</button>
                          </div>
                        </div>

                        {option.mode === "image" ? (
                          <div className='option-image-editor'>
                            {getQuestionImageSrc(option.content) ? (
                              <div className='d-flex flex-wrap align-items-center gap-12'>
                                <img src={getQuestionImageSrc(option.content)} alt={`Variant ${index + 1}`} className='option-image-preview' />
                                <button type='button' className='px-12 py-8 border border-neutral-40 rounded-pill text-14 text-neutral-500 bg-white' onClick={() => updateOption(index, { content: "" })}>Şəkli sil</button>
                              </div>
                            ) : (
                              <label className='option-image-drop border border-neutral-40 rounded-12 text-14 text-neutral-500 mb-0'>
                                {uploadingField === `option-${index}` ? "Yüklənir..." : "Şəkil seç"}
                                <input type='file' accept='image/*' className='d-none' disabled={Boolean(uploadingField)} onChange={(event) => handleOptionImageUpload(index, event)} />
                              </label>
                            )}
                          </div>
                        ) : (
                          <textarea className='common-input rounded-12 w-100' rows='2' maxLength='2000' placeholder={`Variant ${index + 1}`} value={option.content} onChange={(event) => updateOption(index, { content: event.target.value })} />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className='col-12'>
                <div className='d-flex align-items-center justify-content-between gap-12 mb-12'>
                  <h5 className='text-16 fw-semibold text-neutral-500 mb-0'>Qəbul edilən cavablar</h5>
                  <button type='button' className='px-14 py-8 border border-neutral-40 rounded-pill text-14 text-neutral-500 bg-white' onClick={addAcceptedAnswer} disabled={acceptedAnswers.length >= 10}>Cavab əlavə et</button>
                </div>
                <div className='d-flex flex-column gap-12'>
                  {acceptedAnswers.map((answer, index) => (
                    <div className='d-flex flex-wrap align-items-center gap-12' key={index}>
                      <input className='common-input rounded-pill flex-grow-1 min-w-240-px' placeholder={`Cavab ${index + 1}`} value={answer.value} onChange={(event) => updateAcceptedAnswer(index, { value: event.target.value })} />
                      <select className='form-select rounded-pill border-neutral-40 text-14 py-11 px-16 w-auto min-w-170-px' value={answer.matchType} onChange={(event) => updateAcceptedAnswer(index, { matchType: event.target.value })}>
                        {matchTypes.map((matchType) => <option value={matchType} key={matchType}>{matchTypeLabels[matchType]}</option>)}
                      </select>
                      <label className='d-flex align-items-center gap-8 text-14 text-neutral-500 mb-0'>
                        <input type='checkbox' checked={answer.caseSensitive} onChange={(event) => updateAcceptedAnswer(index, { caseSensitive: event.target.checked })} />
                        Böyük/kiçik hərfə həssas
                      </label>
                      <button type='button' className='px-12 py-8 border border-neutral-40 rounded-pill text-14 text-neutral-500 bg-white' onClick={() => setAcceptedAnswers((current) => current.filter((_, answerIndex) => answerIndex !== index))} disabled={acceptedAnswers.length <= 1}>Sil</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className='col-12 d-flex align-items-center gap-12 mt-24'>
              <button type='submit' className='btn btn-main rounded-pill px-24' disabled={isSubmitting || Boolean(uploadingField) || !canSubmit}>{isSubmitting ? "Yadda saxlanır..." : "Yadda saxla"}</button>
              <button type='button' className='px-18 py-10 border border-neutral-40 rounded-pill text-14 text-neutral-500 bg-white' onClick={() => router.push("/admin/questions")}>Ləğv et</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AdminQuestionFormPage;
