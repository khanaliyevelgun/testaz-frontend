"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import AdminRefreshButton from "@/components/admin/AdminRefreshButton";
import AdminStatusBadge from "@/components/admin/AdminStatusBadge";
import {
  addExamAssignments,
  archiveExam,
  deleteExam,
  fetchExam,
  regenerateExamShareToken,
  revokeExamAssignment,
  unarchiveExam,
} from "@/lib/api";
import { formatDateTime as formatDate } from "@/lib/format";
import StaticText from "@/components/StaticText";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import AdminCardSkeleton from "@/components/admin/AdminCardSkeleton";
import { useTranslation } from "@/components/LocaleProvider";


const getExamCode = (exam) => exam?.examCode || exam?.shareToken || exam?.code || "";

const getPreviewPath = (exam) => {
  const code = getExamCode(exam);
  return code ? `/exam/${encodeURIComponent(code)}` : "";
};

const getPreviewUrl = (exam) => {
  const path = getPreviewPath(exam);
  if (!path) return "";
  if (typeof window === "undefined") return path;
  return `${window.location.origin}${path}`;
};

const AdminExamDetailPage = ({ examId }) => {
  const router = useRouter();
  const { t } = useTranslation();
  const [exam, setExam] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActing, setIsActing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const [assignmentInput, setAssignmentInput] = useState("");

  const loadExam = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      setExam(await fetchExam(examId));
    } catch (requestError) {
      setError(requestError?.message || "İmtahan yüklənmədi.");
    } finally {
      setIsLoading(false);
    }
  }, [examId]);

  useEffect(() => {
    loadExam();
  }, [loadExam]);

  const copyLink = async () => {
    const examLink = getPreviewUrl(exam);
    if (!examLink) return;
    try {
      await navigator.clipboard.writeText(examLink);
      setCopyStatus("Kopyalandı");
    } catch {
      setCopyStatus("Linki seçib əl ilə kopyalayın");
    }
  };

  const runAction = async ({ action, successMessage, confirmation }) => {
    if (confirmation && !window.confirm(confirmation)) return;
    setIsActing(true);
    setError("");
    setNotice("");

    try {
      const updatedExam = await action();
      if (updatedExam?.examId) {
        setExam(updatedExam);
      } else {
        await loadExam();
      }
      setNotice(successMessage);
    } catch (requestError) {
      setError(requestError?.message || "İmtahan əməliyyatı alınmadı.");
    } finally {
      setIsActing(false);
    }
  };

  const changeArchiveState = () =>
    runAction({
      action: () => (exam?.status === "ARCHIVED" ? unarchiveExam(examId) : archiveExam(examId)),
      successMessage: exam?.status === "ARCHIVED" ? "İmtahan bərpa edildi." : "İmtahan arxivləşdirildi.",
      confirmation:
        exam?.status === "ARCHIVED"
          ? "Bu imtahanı bərpa edib şagirdlərə yenidən giriş icazəsi verək?"
          : "Bu imtahanı arxivləşdirək? Şagirdlər artıq onu önizləyə və ya başlada bilməyəcək.",
    });

  const removeExam = async () => {
    if (!window.confirm("Bu imtahanı həmişəlik silək? Bu, yalnız cəhdləri olmadıqda mümkündür.")) return;
    setIsActing(true);
    setError("");
    try {
      await deleteExam(examId);
      router.replace("/admin/exams");
      router.refresh();
    } catch (requestError) {
      setError(requestError?.message || "İmtahan silinmədi. Artıq cəhdləri olan imtahanları arxivləşdirin.");
      setIsActing(false);
    }
  };

  const addAssignments = async (event) => {
    event.preventDefault();
    const userIds = [...new Set(assignmentInput.split(/[\s,;]+/).map((value) => value.trim()).filter(Boolean))];
    if (!userIds.length) {
      setError("Ən azı bir istifadəçi ID-si daxil edin.");
      return;
    }

    await runAction({
      action: () => addExamAssignments(examId, userIds),
      successMessage: t("messages.assignmentsAdded", { count: userIds.length }),
    });
    setAssignmentInput("");
  };

  const revokeAssignment = (userId) =>
    runAction({
      action: () => revokeExamAssignment(examId, userId),
      successMessage: "Təyinat ləğv edildi.",
      confirmation: "Bu şagirdi təyinat siyahısından çıxaraq?",
    });

  // Rotate the share code: the old link stops working immediately, so confirm first, then reload the
  // exam so the displayed link reflects the new code. (regenerate returns only {examId, shareToken},
  // not the full exam detail, so we can't reuse runAction's set-updated-exam path.)
  const regenerateCode = async () => {
    if (!window.confirm("Paylaşım kodunu yeniləyək? Cari link işləməyi dayandıracaq və onu paylaşdığınız hər kəsə yeni link lazım olacaq.")) return;
    setIsActing(true);
    setError("");
    setNotice("");
    setCopyStatus("");
    try {
      await regenerateExamShareToken(examId);
      await loadExam();
      setNotice("Paylaşım kodu yeniləndi. Köhnə link artıq işləmir.");
    } catch (requestError) {
      setError(requestError?.message || "Paylaşım kodu yenilənmədi.");
    } finally {
      setIsActing(false);
    }
  };

  return (
    <div className='px-24 py-24'>
      <div className='bg-white rounded-10 px-24 py-24'>
        <div className='d-flex flex-wrap align-items-center justify-content-between gap-16 mb-24'>
          <div>
            <h4 className='fw-semibold text-neutral-500 text-20 mb-4'><StaticText text={"Exam Detail"} /></h4>
            <p className='text-14 text-neutral-400 mb-0'>{examId}</p>
          </div>
          <div className='d-flex flex-wrap align-items-center gap-8'>
            <Link href='/admin/exams' className='px-18 py-10 border border-neutral-40 rounded-pill text-14 text-neutral-500 bg-white'><StaticText text={"Exams"} /></Link>
            <Link href={`/admin/exams/${examId}/statistics`} className='px-18 py-10 border border-neutral-40 rounded-pill text-14 text-neutral-500 bg-white'><StaticText text={"Statistics"} /></Link>
            <Link href={`/admin/exams/${examId}/attempts`} className='btn btn-main rounded-pill px-20'><StaticText text={"Attempts"} /></Link>
            {exam ? (
              <>
                <button type='button' className='px-18 py-10 border border-neutral-40 rounded-pill text-14 text-neutral-500 bg-white' disabled={isActing} onClick={changeArchiveState}>
                  {exam.status === "ARCHIVED" ? <StaticText text={"Restore"} /> : <StaticText text={"Archive"} />}
                </button>
                <button type='button' className='px-18 py-10 border border-danger-200 rounded-pill text-14 text-danger bg-white' disabled={isActing} onClick={removeExam}>
                  <StaticText text={"Delete"} />
                </button>
              </>
            ) : null}
            <AdminRefreshButton isLoading={isLoading} onClick={loadExam} />
          </div>
        </div>

        {isLoading ? <AdminCardSkeleton rows={4} /> : null}
        {notice ? <div className='alert alert-success text-14 py-10 mb-16'>{notice}</div> : null}
        {error ? <div className='alert alert-danger text-14 py-10 mb-16'>{error}</div> : null}

        {exam ? (
          <>
            <div className='row gy-3 mb-24'>
              <div className='col-md-6'>
                <div className='border border-neutral-30 rounded-12 p-16 h-100'>
                  <span className='text-13 text-neutral-400 d-block mb-4'><StaticText text={"Title"} /></span>
                  <strong className='text-16 text-neutral-500'>{exam.title || <StaticText text={"Untitled exam"} />}</strong>
                  {exam.description ? <p className='text-14 text-neutral-400 mt-8 mb-0'>{exam.description}</p> : null}
                </div>
              </div>
              <div className='col-md-2'><div className='border border-neutral-30 rounded-12 p-16 h-100'><span className='text-13 text-neutral-400 d-block mb-4'><StaticText text={"Status"} /></span><AdminStatusBadge status={exam.status} /></div></div>
              <div className='col-md-2'><div className='border border-neutral-30 rounded-12 p-16 h-100'><span className='text-13 text-neutral-400 d-block mb-4'><StaticText text={"Questions"} /></span><strong className='text-16 text-neutral-500'>{exam.totalQuestions ?? "-"}</strong></div></div>
              <div className='col-md-2'><div className='border border-neutral-30 rounded-12 p-16 h-100'><span className='text-13 text-neutral-400 d-block mb-4'><StaticText text={"Max score"} /></span><strong className='text-16 text-neutral-500'>{exam.totalMaxScore ?? "-"}</strong></div></div>
              <div className='col-md-3'><div className='border border-neutral-30 rounded-12 p-16 h-100'><span className='text-13 text-neutral-400 d-block mb-4'><StaticText text={"Visibility"} /></span><strong className='text-15 text-neutral-500'>{exam.visibility || "-"}</strong></div></div>
              <div className='col-md-3'><div className='border border-neutral-30 rounded-12 p-16 h-100'><span className='text-13 text-neutral-400 d-block mb-4'><StaticText text={"Scoring"} /></span><strong className='text-15 text-neutral-500'>{exam.scoringPolicy || "-"}</strong></div></div>
              <div className='col-md-3'><div className='border border-neutral-30 rounded-12 p-16 h-100'><span className='text-13 text-neutral-400 d-block mb-4'><StaticText text={"Duration"} /></span><strong className='text-15 text-neutral-500'>{exam.durationMinutes ? `${exam.durationMinutes} min` : <StaticText text={"Untimed"} />}</strong></div></div>
              <div className='col-md-3'><div className='border border-neutral-30 rounded-12 p-16 h-100'><span className='text-13 text-neutral-400 d-block mb-4'><StaticText text={"Created"} /></span><strong className='text-15 text-neutral-500'>{formatDate(exam.createdAt)}</strong></div></div>
            </div>

            <div className='mb-24'>
              <label className='text-14 text-neutral-500 fw-medium mb-8'><StaticText text={"Exam link"} /></label>
              <div className='d-flex flex-wrap align-items-center gap-10'>
                <input className='common-input rounded-pill flex-grow-1 min-w-240-px' readOnly value={getPreviewUrl(exam)} onFocus={(event) => event.target.select()} />
                <button type='button' className='btn btn-main rounded-pill px-20' onClick={copyLink}>
                  <StaticText text={"Copy link"} />
                </button>
                <button type='button' className='px-18 py-10 border border-neutral-40 rounded-pill text-14 text-neutral-500 bg-white d-inline-flex align-items-center gap-8' disabled={isActing} onClick={regenerateCode}>
                  <i className='ph ph-arrows-clockwise' aria-hidden='true' />
                  <StaticText text={"Regenerate code"} />
                </button>
              </div>
              <p className='text-13 text-neutral-400 mt-8 mb-0'><StaticText text={"Paylaşım kodunu yeniləmək köhnə linki dərhal işləməz edir."} /></p>
              {copyStatus ? <p className='text-14 text-neutral-400 mt-4 mb-0'>{copyStatus}</p> : null}
            </div>

            <div className='border border-neutral-30 rounded-12 p-20 mb-24'>
              <div className='d-flex flex-wrap align-items-start justify-content-between gap-12 mb-16'>
                <div>
                  <h5 className='text-16 fw-semibold text-neutral-500 mb-4'><StaticText text={"Assigned learners"} /></h5>
                  <p className='text-13 text-neutral-400 mb-0'>
                    <StaticText text={"Adding learners switches the exam to assigned visibility."} />
                  </p>
                </div>
                <span className='text-13 text-neutral-400'>{exam.assignedUserIds?.length || 0} <StaticText text={"assigned"} /></span>
              </div>
              <form className='d-flex flex-wrap align-items-center gap-10 mb-16' onSubmit={addAssignments}>
                <input
                  className='common-input rounded-pill flex-grow-1 min-w-240-px'
                  placeholder='İstifadəçi ID-lərini vergül və ya boşluqla ayıraraq daxil edin'
                  value={assignmentInput}
                  onChange={(event) => setAssignmentInput(event.target.value)}
                />
                <button type='submit' className='btn btn-main rounded-pill px-20' disabled={isActing}>
                  <StaticText text={"Add assignments"} />
                </button>
              </form>
              {exam.assignedUserIds?.length ? (
                <div className='d-flex flex-wrap gap-8'>
                  {exam.assignedUserIds.map((userId) => (
                    <span className='d-inline-flex align-items-center gap-8 px-12 py-8 rounded-pill bg-main-25 text-main-600 text-13' key={userId}>
                      {userId}
                      <button
                        type='button'
                        className='border-0 bg-transparent text-danger p-0 d-flex'
                        aria-label={`Remove ${userId}`}
                        disabled={isActing}
                        onClick={() => revokeAssignment(userId)}
                      >
                        <i className='ph-bold ph-x' />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className='text-14 text-neutral-400 mb-0'><StaticText text={"No learners are assigned."} /></p>
              )}
            </div>

            <h5 className='text-16 fw-semibold text-neutral-500 mb-12'><StaticText text={"Sections"} /></h5>
            <div className='table-responsive admin-users-table'>
              <table className='table mb-0'>
                <thead>
                  <tr>
                    <th className='text-12 fw-medium text-neutral-500 py-16 px-20'><StaticText text={"Section"} /></th>
                    <th className='text-12 fw-medium text-neutral-500 py-16 px-20'><StaticText text={"Subject"} /></th>
                    <th className='text-12 fw-medium text-neutral-500 py-16 px-20'><StaticText text={"Type"} /></th>
                    <th className='text-12 fw-medium text-neutral-500 py-16 px-20'><StaticText text={"Difficulty"} /></th>
                    <th className='text-12 fw-medium text-neutral-500 py-16 px-20'><StaticText text={"Questions"} /></th>
                    <th className='text-12 fw-medium text-neutral-500 py-16 px-20'><StaticText text={"Points"} /></th>
                  </tr>
                </thead>
                <tbody>
                  {exam.sections?.length ? (
                    exam.sections.map((section) => (
                      <tr key={section.sectionId || section.orderIndex}>
                        <td className='py-16 px-20 text-14 text-neutral-500'>{section.title || `Section ${Number(section.orderIndex || 0) + 1}`}</td>
                        <td className='py-16 px-20 text-14 text-neutral-500'>#{section.subjectId}</td>
                        <td className='py-16 px-20 text-14 text-neutral-500'>{section.typeFilter || "-"}</td>
                        <td className='py-16 px-20 text-14 text-neutral-500'>{section.difficultyFilter || "-"}</td>
                        <td className='py-16 px-20 text-14 text-neutral-500'>{section.questionCount ?? "-"}</td>
                        <td className='py-16 px-20 text-14 text-neutral-500'>{section.pointsCorrect ?? "-"} / -{section.penaltyWrong ?? 0}</td>
                      </tr>
                    ))
                  ) : (
                    <AdminEmptyState columns={6} icon='ph ph-squares-four'><StaticText text={"No sections found."} /></AdminEmptyState>
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default AdminExamDetailPage;
