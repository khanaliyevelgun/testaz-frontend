"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchSession, fetchSessionProgress, getApiAssetUrl, saveSessionAnswer, submitSession } from "@/lib/api";
import { renderQuestionHtml } from "@/lib/questionContent";
import StaticText from "@/components/StaticText";


const TEXT_SAVE_DELAY_MS = 700;

const msUntil = (dateValue) => {
  if (!dateValue) return null;
  return Math.max(new Date(dateValue).getTime() - Date.now(), 0);
};

const formatRemaining = (milliseconds) => {
  if (milliseconds == null) return "Untimed";
  const totalSeconds = Math.ceil(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
};

const isAnswered = (question) =>
  Boolean((question?.selectedOptionIds || []).length || String(question?.answerText || "").trim());

const buildAnswerPayload = (question) => ({
  selectedOptionIds: question?.type === "SHORT_TEXT" ? [] : question?.selectedOptionIds || [],
  answerText: question?.type === "SHORT_TEXT" ? question?.answerText || "" : "",
});

const ExamSessionPage = ({ sessionId }) => {
  const router = useRouter();
  const saveTimersRef = useRef(new Map());
  const pendingTextRef = useRef(new Map());
  const [session, setSession] = useState(null);
  const [progress, setProgress] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [remainingMs, setRemainingMs] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [savingIds, setSavingIds] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const questions = session?.questions || [];
  const question = questions[currentIndex];
  const isActive = session?.status === "IN_PROGRESS";
  const isSaving = savingIds.length > 0;

  const answeredMap = useMemo(() => {
    const map = new Map();
    (progress?.questions || []).forEach((item) => map.set(item.sessionQuestionId, Boolean(item.answered)));
    questions.forEach((item) => {
      if (!map.has(item.sessionQuestionId)) map.set(item.sessionQuestionId, isAnswered(item));
    });
    return map;
  }, [progress, questions]);

  const setQuestionProgress = useCallback((updatedQuestion, ack) => {
    setProgress((current) => {
      const progressById = new Map();
      (current?.questions || []).forEach((item) => progressById.set(item.sessionQuestionId, item));

      const nextQuestions = questions.map((item) => {
        const existing = progressById.get(item.sessionQuestionId);
        return {
          sessionQuestionId: item.sessionQuestionId,
          orderIndex: item.orderIndex,
          answered:
            item.sessionQuestionId === updatedQuestion.sessionQuestionId
              ? isAnswered(updatedQuestion)
              : Boolean(existing?.answered ?? isAnswered(item)),
        };
      });

      return {
        sessionId,
        totalQuestions: current?.totalQuestions ?? session?.totalQuestions ?? questions.length,
        answeredCount: ack?.answeredCount ?? nextQuestions.filter((item) => item.answered).length,
        questions: nextQuestions,
      };
    });

    setSession((current) => {
      if (!current) return current;
      return {
        ...current,
        answeredCount: ack?.answeredCount ?? current.answeredCount,
      };
    });
  }, [questions, session?.totalQuestions, sessionId]);

  const persistAnswer = useCallback(async (nextQuestion) => {
    if (!nextQuestion?.sessionQuestionId || !isActive) return null;

    setSavingIds((current) =>
      current.includes(nextQuestion.sessionQuestionId) ? current : [...current, nextQuestion.sessionQuestionId]
    );
    setError("");

    try {
      const ack = await saveSessionAnswer(sessionId, nextQuestion.sessionQuestionId, buildAnswerPayload(nextQuestion));
      setQuestionProgress(nextQuestion, ack);
      return ack;
    } catch (requestError) {
      setError(requestError?.message || "Cavab yadda saxlanılmadı.");
      throw requestError;
    } finally {
      setSavingIds((current) => current.filter((id) => id !== nextQuestion.sessionQuestionId));
    }
  }, [isActive, sessionId, setQuestionProgress]);

  const clearSaveTimer = useCallback((sessionQuestionId) => {
    const timer = saveTimersRef.current.get(sessionQuestionId);
    if (timer) {
      window.clearTimeout(timer);
      saveTimersRef.current.delete(sessionQuestionId);
    }
  }, []);

  const flushPendingTextAnswer = useCallback(async (sessionQuestionId) => {
    const pendingQuestion = pendingTextRef.current.get(sessionQuestionId);
    if (!pendingQuestion) return;
    clearSaveTimer(sessionQuestionId);
    pendingTextRef.current.delete(sessionQuestionId);
    await persistAnswer(pendingQuestion);
  }, [clearSaveTimer, persistAnswer]);

  const scheduleTextSave = useCallback((nextQuestion) => {
    if (!nextQuestion?.sessionQuestionId) return;
    pendingTextRef.current.set(nextQuestion.sessionQuestionId, nextQuestion);
    clearSaveTimer(nextQuestion.sessionQuestionId);
    const timer = window.setTimeout(() => {
      flushPendingTextAnswer(nextQuestion.sessionQuestionId).catch(() => {});
    }, TEXT_SAVE_DELAY_MS);
    saveTimersRef.current.set(nextQuestion.sessionQuestionId, timer);
  }, [clearSaveTimer, flushPendingTextAnswer]);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const [sessionResponse, progressResponse] = await Promise.all([
        fetchSession(sessionId),
        fetchSessionProgress(sessionId).catch(() => null),
      ]);
      setSession(sessionResponse);
      setProgress(progressResponse);
      setCurrentIndex(0);
      setRemainingMs(msUntil(sessionResponse?.expiresAt));
    } catch (requestError) {
      setError(requestError?.message || "İmtahan sessiyası yüklənmədi.");
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    return () => {
      saveTimersRef.current.forEach((timer) => window.clearTimeout(timer));
      saveTimersRef.current.clear();
      pendingTextRef.current.clear();
    };
  }, []);

  useEffect(() => {
    if (currentIndex > Math.max(questions.length - 1, 0)) {
      setCurrentIndex(Math.max(questions.length - 1, 0));
    }
  }, [currentIndex, questions.length]);

  const submit = useCallback(async () => {
    if (isSubmitting || !session) return;
    setIsSubmitting(true);
    setError("");
    try {
      await Promise.all([...pendingTextRef.current.keys()].map((id) => flushPendingTextAnswer(id)));
      await submitSession(sessionId);
      router.replace("/admin/quiz-attempts");
    } catch (requestError) {
      setError(requestError?.message || "İmtahan təqdim edilmədi.");
      setIsSubmitting(false);
    }
  }, [flushPendingTextAnswer, isSubmitting, router, session, sessionId]);

  useEffect(() => {
    if (!session?.expiresAt || session.status !== "IN_PROGRESS") return undefined;
    const timerId = window.setInterval(() => {
      const nextRemaining = msUntil(session.expiresAt);
      setRemainingMs(nextRemaining);
      if (nextRemaining === 0) {
        window.clearInterval(timerId);
        submit();
      }
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [session?.expiresAt, session?.status, submit]);

  const updateQuestion = (patch, { deferSave = false } = {}) => {
    if (!question || !isActive) return;
    const nextQuestion = { ...question, ...patch };
    setSession((current) => ({
      ...current,
      questions: current.questions.map((item, index) => (index === currentIndex ? nextQuestion : item)),
    }));

    if (deferSave) {
      scheduleTextSave(nextQuestion);
      return;
    }

    pendingTextRef.current.delete(nextQuestion.sessionQuestionId);
    clearSaveTimer(nextQuestion.sessionQuestionId);
    persistAnswer(nextQuestion).catch(() => {});
  };

  const toggleOption = (optionId) => {
    if (!question || !isActive) return;
    if (question.type === "MULTIPLE_CHOICE") {
      const selected = new Set(question.selectedOptionIds || []);
      if (selected.has(optionId)) selected.delete(optionId);
      else selected.add(optionId);
      updateQuestion({ selectedOptionIds: [...selected] });
      return;
    }
    updateQuestion({ selectedOptionIds: [optionId] });
  };

  const goToIndex = async (index) => {
    if (question?.type === "SHORT_TEXT") {
      await flushPendingTextAnswer(question.sessionQuestionId).catch(() => {});
    }
    setCurrentIndex(Math.min(Math.max(index, 0), Math.max(questions.length - 1, 0)));
  };

  if (isLoading) {
    return <div className='px-24 py-24'><div className='bg-white rounded-10 px-24 py-24'><p className='text-14 text-neutral-400 mb-0'><StaticText text={"Loading..."} /></p></div></div>;
  }

  return (
    <div className='px-24 py-24'>
      <div className='bg-white rounded-10 px-24 py-24'>
        <div className='d-flex flex-wrap align-items-center justify-content-between gap-16 mb-24'>
          <div>
            <h4 className='fw-semibold text-neutral-500 text-20 mb-4'><StaticText text={"Exam session"} /></h4>
            <p className='text-14 text-neutral-400 mb-0'>
              {session?.totalQuestions ?? questions.length} <StaticText text={"questions"} /> / {progress?.answeredCount ?? session?.answeredCount ?? questions.filter(isAnswered).length} <StaticText text={"answered"} />
            </p>
            {!isActive && session?.status ? (
              <p className='text-13 text-neutral-400 mb-0 mt-4'><StaticText text={"Status:"} /> {session.status}</p>
            ) : null}
          </div>
          <div className='d-flex align-items-center gap-12'>
            <span className='px-16 py-10 rounded-8 bg-main-25 text-main-600 fw-semibold'>{formatRemaining(remainingMs)}</span>
            <button type='button' className='btn btn-main rounded-pill px-20' onClick={submit} disabled={isSubmitting || !session || !isActive}>
              {isSubmitting ? <StaticText text={"Ending..."} /> : <StaticText text={"End exam"} />}
            </button>
          </div>
        </div>

        {!isActive && session?.status && session.status !== "IN_PROGRESS" ? (
          <div className='alert alert-info d-flex flex-wrap align-items-center justify-content-between gap-12 text-14 py-12 mb-16'>
            <span>
              {session.status === "EXPIRED"
                ? <StaticText text={"Bu imtahanın vaxtı bitib. Cavablarınız avtomatik təqdim edildi."} />
                : <StaticText text={"Bu imtahanı artıq tamamlamısınız. Bu, cavablarınızın yalnız oxuna bilən görünüşüdür."} />}
            </span>
            <button type='button' className='btn btn-main rounded-pill px-20' onClick={() => router.replace(`/sessions/${sessionId}/result`)}>
              <StaticText text={"Nəticələrə bax"} />
            </button>
          </div>
        ) : null}

        {error ? <div className='alert alert-danger text-14 py-10 mb-16'>{error}</div> : null}
        {isSaving ? <p className='text-13 text-neutral-400 mb-12'><StaticText text={"Saving..."} /></p> : null}

        <div className='d-flex flex-wrap gap-8 mb-24'>
          {questions.map((item, index) => (
            <button
              type='button'
              className={`w-40 h-40 rounded-8 border text-14 ${index === currentIndex ? "bg-main-600 text-white border-main-600" : answeredMap.get(item.sessionQuestionId) ? "bg-neutral-40 text-neutral-500 border-neutral-40" : "bg-white text-neutral-500 border-neutral-40"}`}
              key={item.sessionQuestionId}
              onClick={() => goToIndex(index)}
            >
              {index + 1}
            </button>
          ))}
        </div>

        {question ? (
          <div className='border border-neutral-30 rounded-8 p-20'>
            <div className='d-flex justify-content-between gap-12 mb-16'>
              <h5 className='text-16 fw-semibold text-neutral-500 mb-0'><StaticText text={"Question"} /> {currentIndex + 1}</h5>
            </div>

            {question.mediaPath ? (
              question.mediaType?.startsWith("audio/") ? (
                <audio controls className='w-100 mb-16' src={getApiAssetUrl(question.mediaPath)}>
                  <StaticText text={"Your browser does not support audio playback."} />
                </audio>
              ) : (
                <img src={getApiAssetUrl(question.mediaPath)} alt='' className='mb-16 rounded-8 max-w-100' />
              )
            ) : null}
            <div className='text-15 text-neutral-500 mb-20' dangerouslySetInnerHTML={renderQuestionHtml(question.stem || "")} />

            {question.type === "SHORT_TEXT" ? (
              <textarea
                className='common-input rounded-8'
                rows='4'
                value={question.answerText || ""}
                disabled={!isActive}
                onBlur={() => flushPendingTextAnswer(question.sessionQuestionId).catch(() => {})}
                onChange={(event) => updateQuestion({ answerText: event.target.value }, { deferSave: true })}
              />
            ) : (
              <div className='d-flex flex-column gap-10'>
                {(question.options || []).map((option) => {
                  const checked = (question.selectedOptionIds || []).includes(option.optionId);
                  return (
                    <label className='border border-neutral-30 rounded-8 px-16 py-12 d-flex align-items-start gap-10' key={option.optionId}>
                      <input
                        type={question.type === "MULTIPLE_CHOICE" ? "checkbox" : "radio"}
                        checked={checked}
                        disabled={!isActive}
                        onChange={() => toggleOption(option.optionId)}
                      />
                      <span className='text-14 text-neutral-500' dangerouslySetInnerHTML={renderQuestionHtml(option.content || "")} />
                    </label>
                  );
                })}
              </div>
            )}

            <div className='d-flex justify-content-between gap-12 mt-24'>
              <button type='button' className='px-18 py-10 border border-neutral-40 rounded-pill text-14 text-neutral-500 bg-white' disabled={currentIndex <= 0} onClick={() => goToIndex(currentIndex - 1)}><StaticText text={"Previous"} /></button>
              {currentIndex >= questions.length - 1 ? (
                <button type='button' className='btn btn-main rounded-pill px-24' onClick={submit} disabled={isSubmitting || !isActive}><StaticText text={"End exam"} /></button>
              ) : (
                <button type='button' className='btn btn-main rounded-pill px-24' onClick={() => goToIndex(currentIndex + 1)}><StaticText text={"Next"} /></button>
              )}
            </div>
          </div>
        ) : (
          <p className='text-14 text-neutral-400 mb-0'><StaticText text={"No questions found."} /></p>
        )}
      </div>
    </div>
  );
};

export default ExamSessionPage;
