"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchPublicSubjects, fetchPublicTopics, startSession } from "@/lib/api";
import StaticText from "@/components/StaticText";
import AdminRefreshButton from "@/components/admin/AdminRefreshButton";

const DIFFICULTIES = [
  { value: "EASY", label: "Asan" },
  { value: "MEDIUM", label: "Orta" },
  { value: "HARD", label: "Çətin" },
];

// Backend defaults count to 20 and caps it at 100 (StartSessionRequest @Min(1) @Max(100)).
const DEFAULT_COUNT = 20;
const MIN_COUNT = 5;
const MAX_COUNT = 50;
const COUNT_STEP = 5;
const COUNT_OPTIONS = [];
for (let value = MIN_COUNT; value <= MAX_COUNT; value += COUNT_STEP) {
  COUNT_OPTIONS.push(value);
}

const subjectName = (subject) => subject?.nameAz || subject?.nameEn || subject?.code || "-";
const topicName = (topic) => topic?.nameAz || topic?.code || "-";

const ChildPracticePage = () => {
  const router = useRouter();

  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState("");
  const [hint, setHint] = useState("");
  const [loadError, setLoadError] = useState("");

  const [subjectId, setSubjectId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [difficulty, setDifficulty] = useState("MEDIUM");
  const [count, setCount] = useState(DEFAULT_COUNT);

  const loadSubjects = async () => {
    setIsLoadingSubjects(true);
    setLoadError("");
    try {
      const response = await fetchPublicSubjects();
      setSubjects(Array.isArray(response) ? response : []);
    } catch (requestError) {
      setLoadError(requestError?.message || "Fənlər yüklənmədi.");
    } finally {
      setIsLoadingSubjects(false);
    }
  };

  useEffect(() => {
    loadSubjects();
    // loadSubjects is stable for this mount-only fetch; the manual refresh button reuses it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When the subject changes, load its topics (optional filter) and reset any prior topic choice.
  useEffect(() => {
    setTopicId("");
    if (!subjectId) {
      setTopics([]);
      return undefined;
    }
    const selected = subjects.find((subject) => String(subject.id) === String(subjectId));
    if (!selected?.code) {
      setTopics([]);
      return undefined;
    }

    let isMounted = true;
    setIsLoadingTopics(true);
    fetchPublicTopics(selected.code)
      .then((response) => {
        if (isMounted) setTopics(Array.isArray(response) ? response : []);
      })
      .catch(() => {
        // Topics are optional — a failure just means no topic filter is offered.
        if (isMounted) setTopics([]);
      })
      .finally(() => {
        if (isMounted) setIsLoadingTopics(false);
      });
    return () => {
      isMounted = false;
    };
  }, [subjectId, subjects]);

  // Clear a stale start error/hint as soon as the student adjusts the selection.
  const clearFeedback = () => {
    if (error) setError("");
    if (hint) setHint("");
  };

  const start = async (event) => {
    event.preventDefault();
    if (isStarting) return;
    setError("");
    setHint("");

    if (!subjectId) {
      setError("Zəhmət olmasa bir fənn seçin.");
      return;
    }
    if (!difficulty) {
      setError("Zəhmət olmasa çətinlik səviyyəsini seçin.");
      return;
    }

    setIsStarting(true);
    try {
      const session = await startSession({
        type: "PRACTICE",
        subjectId: Number(subjectId),
        topicId: topicId ? Number(topicId) : undefined,
        difficulty,
        count: Number(count) || DEFAULT_COUNT,
      });
      const sessionId = session?.id || session?.sessionId;
      if (!sessionId) {
        setError("Sessiya başladıla bilmədi.");
        setIsStarting(false);
        return;
      }
      router.push(`/admin/exam-session/${sessionId}`);
    } catch (requestError) {
      setError(requestError?.message || "Məşq sessiyası başladıla bilmədi.");
      // The bank can run out of unseen questions for a narrow selection (422). Guide the
      // student to broaden it instead of leaving a dead end — a topic filter is the usual cause.
      if (requestError?.status === 422) {
        setHint(
          topicId
            ? "İpucu: “Bütün mövzular”ı seçin və ya başqa çətinlik səviyyəsi sınayın."
            : "İpucu: başqa fənn və ya çətinlik səviyyəsi sınayın."
        );
      }
      setIsStarting(false);
    }
  };

  return (
    <div className='px-24 py-24'>
      <div className='bg-white rounded-10 px-24 py-24'>
        <div className='d-flex flex-wrap align-items-center justify-content-between gap-16 mb-24'>
          <div>
            <h4 className='fw-semibold text-neutral-500 text-20 mb-4'><StaticText text={"Practice"} /></h4>
            <p className='text-14 text-neutral-400 mb-0'><StaticText text={"Bir fənn seçin və özünüzü sınamaq üçün məşq testinə başlayın."} /></p>
          </div>
          <AdminRefreshButton isLoading={isLoadingSubjects} onClick={loadSubjects} />
        </div>

        {loadError ? <div className='alert alert-danger text-14 py-10 mb-16'>{loadError}</div> : null}
        {error ? (
          <div className='alert alert-danger text-14 py-10 mb-16'>
            <span className='d-block'>{error}</span>
            {hint ? <span className='d-block mt-4 text-13'>{hint}</span> : null}
          </div>
        ) : null}

        <form onSubmit={start}>
          <div className='row gy-4'>
            <div className='col-md-6'>
              <label className='text-13 fw-medium text-neutral-500 mb-8 d-block' htmlFor='practice-subject'>
                <StaticText text={"Fənn"} /> <span className='text-danger-600'>*</span>
              </label>
              <select
                id='practice-subject'
                className='form-select rounded-pill border-neutral-40 text-14 py-11 px-16'
                value={subjectId}
                disabled={isLoadingSubjects || isStarting}
                onChange={(changeEvent) => { clearFeedback(); setSubjectId(changeEvent.target.value); }}
              >
                <option value=''>{isLoadingSubjects ? "Yüklənir..." : "Fənn seçin"}</option>
                {subjects.map((subject) => (
                  <option value={subject.id} key={subject.id}>{subjectName(subject)}</option>
                ))}
              </select>
            </div>

            <div className='col-md-6'>
              <label className='text-13 fw-medium text-neutral-500 mb-8 d-block' htmlFor='practice-topic'>
                <StaticText text={"Mövzu (opsional)"} />
              </label>
              <select
                id='practice-topic'
                className='form-select rounded-pill border-neutral-40 text-14 py-11 px-16'
                value={topicId}
                disabled={!subjectId || isLoadingTopics || isStarting}
                onChange={(changeEvent) => { clearFeedback(); setTopicId(changeEvent.target.value); }}
              >
                <option value=''>
                  {!subjectId
                    ? "Əvvəlcə fənn seçin"
                    : isLoadingTopics
                      ? "Yüklənir..."
                      : topics.length
                        ? "Bütün mövzular"
                        : "Mövzu yoxdur"}
                </option>
                {topics.map((topic) => (
                  <option value={topic.id} key={topic.id}>{topicName(topic)}</option>
                ))}
              </select>
            </div>

            <div className='col-md-6'>
              <label className='text-13 fw-medium text-neutral-500 mb-8 d-block' htmlFor='practice-difficulty'>
                <StaticText text={"Çətinlik"} /> <span className='text-danger-600'>*</span>
              </label>
              <select
                id='practice-difficulty'
                className='form-select rounded-pill border-neutral-40 text-14 py-11 px-16'
                value={difficulty}
                disabled={isStarting}
                onChange={(changeEvent) => { clearFeedback(); setDifficulty(changeEvent.target.value); }}
              >
                {DIFFICULTIES.map((item) => (
                  <option value={item.value} key={item.value}>{item.label}</option>
                ))}
              </select>
            </div>

            <div className='col-md-6'>
              <label className='text-13 fw-medium text-neutral-500 mb-8 d-block' htmlFor='practice-count'>
                <StaticText text={"Sual sayı"} />
              </label>
              <select
                id='practice-count'
                className='form-select rounded-pill border-neutral-40 text-14 py-11 px-16'
                value={count}
                disabled={isStarting}
                onChange={(changeEvent) => { clearFeedback(); setCount(Number(changeEvent.target.value)); }}
              >
                {COUNT_OPTIONS.map((value) => (
                  <option value={value} key={value}>{value}</option>
                ))}
              </select>
            </div>
          </div>

          <div className='d-flex flex-wrap align-items-center gap-12 mt-24'>
            <button type='submit' className='btn btn-main rounded-pill px-24' disabled={isStarting || !subjectId}>
              {isStarting ? <StaticText text={"Başlayır..."} /> : <StaticText text={"Məşqə başla"} />}
            </button>
            <span className='text-13 text-neutral-400'>
              <StaticText text={"Məşq testləri vaxt məhdudiyyəti olmadan, faizlə qiymətləndirilir."} />
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChildPracticePage;
