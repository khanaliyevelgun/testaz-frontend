"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { fetchExamDefinition, fetchExamDefinitions, fetchPublicSubjects, startSession } from "@/lib/api";
import StaticText from "@/components/StaticText";
import AdminRefreshButton from "@/components/admin/AdminRefreshButton";

const SESSION_BASE_PATH = "/admin/exam-session";

// A card accent per exam so the two headline exams read distinctly (existing template tokens).
const EXAM_ACCENTS = {
  BURAXILIS: { icon: "ph ph-graduation-cap", tone: "bg-main-25 text-main-600" },
  QEBUL: { icon: "ph ph-exam", tone: "bg-warning-100 text-warning-600" },
};

const examName = (definition) => definition?.nameAz || definition?.code || "-";

const ChildOfficialExamsPage = () => {
  const router = useRouter();

  const [definitions, setDefinitions] = useState([]);
  const [subjectNames, setSubjectNames] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // Selection + the loaded full blueprint of the selected exam.
  const [selectedCode, setSelectedCode] = useState("");
  const [blueprint, setBlueprint] = useState(null);
  const [isLoadingBlueprint, setIsLoadingBlueprint] = useState(false);
  const [groupCode, setGroupCode] = useState("");

  // Start flow (confirm dialog + request state).
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState("");
  const [startHint, setStartHint] = useState("");

  const load = async () => {
    setIsLoading(true);
    setLoadError("");
    try {
      const [definitionsResponse, subjectsResponse] = await Promise.all([
        fetchExamDefinitions(),
        fetchPublicSubjects().catch(() => []),
      ]);
      setDefinitions(Array.isArray(definitionsResponse) ? definitionsResponse : []);
      const names = {};
      (Array.isArray(subjectsResponse) ? subjectsResponse : []).forEach((subject) => {
        if (subject?.code) names[subject.code] = subject.nameAz || subject.nameEn || subject.code;
      });
      setSubjectNames(names);
    } catch (requestError) {
      setLoadError(requestError?.message || "İmtahanlar yüklənmədi.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load the full blueprint (groups + weighted slots) when an exam is selected.
  useEffect(() => {
    setBlueprint(null);
    setGroupCode("");
    setStartError("");
    setStartHint("");
    if (!selectedCode) return undefined;

    let isMounted = true;
    setIsLoadingBlueprint(true);
    fetchExamDefinition(selectedCode)
      .then((response) => {
        if (!isMounted) return;
        setBlueprint(response);
        // A single-group exam (Buraxılış) has no choice — preselect it.
        const groups = response?.groups || [];
        if (groups.length === 1) setGroupCode(groups[0].code);
      })
      .catch((requestError) => {
        if (isMounted) setStartError(requestError?.message || "İmtahan planı yüklənmədi.");
      })
      .finally(() => {
        if (isMounted) setIsLoadingBlueprint(false);
      });
    return () => {
      isMounted = false;
    };
  }, [selectedCode]);

  const groups = blueprint?.groups || [];
  const multiGroup = groups.length > 1;
  const selectedGroup = useMemo(
    () => groups.find((group) => group.code === groupCode) || null,
    [groups, groupCode]
  );
  const canStart = Boolean(selectedCode && (!multiGroup || groupCode));

  const subjectLabel = (code) => subjectNames[code] || code;

  const openConfirm = () => {
    setStartError("");
    if (!canStart) return;
    setConfirmOpen(true);
  };

  const start = async () => {
    if (isStarting) return;
    setStartError("");
    setStartHint("");
    setIsStarting(true);
    try {
      const session = await startSession({
        type: "OFFICIAL_EXAM",
        examCode: selectedCode,
        examGroupCode: multiGroup ? groupCode : undefined,
      });
      const sessionId = session?.id || session?.sessionId;
      if (!sessionId) {
        setStartError("İmtahan sessiyası başladıla bilmədi.");
        setIsStarting(false);
        return;
      }
      router.push(`${SESSION_BASE_PATH}/${sessionId}`);
    } catch (requestError) {
      setConfirmOpen(false);
      setStartError(requestError?.message || "İmtahan başladıla bilmədi.");
      // An official exam needs a large pool of UNSEEN questions per subject slot; the bank can run
      // dry for a student who has already practised those subjects (422). Explain instead of a bare error.
      if (requestError?.status === 422) {
        setStartHint("Bu imtahanın bütün fənləri üzrə kifayət qədər yeni sual olmaya bilər. Başqa qrup və ya imtahan sınayın.");
      }
      setIsStarting(false);
    }
  };

  return (
    <div className='px-24 py-24'>
      <div className='bg-white rounded-10 px-24 py-24'>
        <div className='d-flex flex-wrap align-items-center justify-content-between gap-16 mb-24'>
          <div>
            <h4 className='fw-semibold text-neutral-500 text-20 mb-4'><StaticText text={"Official exams"} /></h4>
            <p className='text-14 text-neutral-400 mb-0'><StaticText text={"Rəsmi Buraxılış və Qəbul imtahanlarının simulyasiyasına başlayın."} /></p>
          </div>
          <AdminRefreshButton isLoading={isLoading} onClick={load} />
        </div>

        {loadError ? <div className='alert alert-danger text-14 py-10 mb-16'>{loadError}</div> : null}
        {startError ? (
          <div className='alert alert-danger text-14 py-10 mb-16'>
            <span className='d-block'>{startError}</span>
            {startHint ? <span className='d-block mt-4 text-13'>{startHint}</span> : null}
          </div>
        ) : null}

        {isLoading ? (
          <p className='text-14 text-neutral-400 mb-0'><StaticText text={"Yüklənir..."} /></p>
        ) : definitions.length ? (
          <div className='row gy-4'>
            {definitions.map((definition) => {
              const accent = EXAM_ACCENTS[definition.code] || { icon: "ph ph-exam", tone: "bg-main-25 text-main-600" };
              const isSelected = selectedCode === definition.code;
              return (
                <div className='col-md-6' key={definition.code}>
                  <button
                    type='button'
                    className={`w-100 text-start border rounded-10 p-20 bg-white ${isSelected ? "border-main-600" : "border-neutral-30"}`}
                    aria-pressed={isSelected}
                    onClick={() => setSelectedCode(isSelected ? "" : definition.code)}
                  >
                    <div className='d-flex align-items-center gap-12 mb-16'>
                      <span className={`w-48 h-48 rounded-12 flex-center ${accent.tone}`}>
                        <i className={`${accent.icon} text-2xl`} aria-hidden='true' />
                      </span>
                      <div>
                        <h5 className='text-16 fw-semibold text-neutral-500 mb-2'>{examName(definition)}</h5>
                        <span className='text-13 text-neutral-400'>{definition.code}</span>
                      </div>
                    </div>
                    <div className='d-flex flex-wrap gap-8'>
                      <span className='px-12 py-6 rounded-pill bg-neutral-30 text-neutral-600 text-13'>
                        {definition.totalQuestions} <StaticText text={"sual"} />
                      </span>
                      <span className='px-12 py-6 rounded-pill bg-neutral-30 text-neutral-600 text-13'>
                        {definition.durationMinutes} <StaticText text={"dəq"} />
                      </span>
                      <span className='px-12 py-6 rounded-pill bg-neutral-30 text-neutral-600 text-13'>
                        {definition.maxScore} <StaticText text={"bal"} />
                      </span>
                      <span className='px-12 py-6 rounded-pill bg-neutral-30 text-neutral-600 text-13'>
                        {definition.negativeMarkingDivisor
                          ? <><StaticText text={"Mənfi qiymətləndirmə"} /></>
                          : <><StaticText text={"Mənfi qiymətləndirmə yoxdur"} /></>}
                      </span>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <p className='text-14 text-neutral-400 mb-0'><StaticText text={"Rəsmi imtahan tapılmadı."} /></p>
        )}

        {selectedCode ? (
          <div className='border border-neutral-30 rounded-10 p-20 mt-24'>
            {isLoadingBlueprint ? (
              <p className='text-14 text-neutral-400 mb-0'><StaticText text={"Yüklənir..."} /></p>
            ) : blueprint ? (
              <>
                <div className='d-flex flex-wrap align-items-center justify-content-between gap-16 mb-16'>
                  <h5 className='text-16 fw-semibold text-neutral-500 mb-0'>{examName(blueprint)}</h5>
                  <button type='button' className='btn btn-main rounded-pill px-24' onClick={openConfirm} disabled={!canStart || isStarting}>
                    <StaticText text={"İmtahana başla"} />
                  </button>
                </div>

                {multiGroup ? (
                  <div className='mb-16' style={{ maxWidth: "320px" }}>
                    <label className='text-13 fw-medium text-neutral-500 mb-8 d-block' htmlFor='exam-group'>
                      <StaticText text={"İxtisas qrupu"} /> <span className='text-danger-600'>*</span>
                    </label>
                    <select
                      id='exam-group'
                      className='form-select rounded-pill border-neutral-40 text-14 py-11 px-16'
                      value={groupCode}
                      disabled={isStarting}
                      onChange={(changeEvent) => { setStartError(""); setStartHint(""); setGroupCode(changeEvent.target.value); }}
                    >
                      <option value=''>{"Qrup seçin"}</option>
                      {[...groups].sort((first, second) => (first.orderIndex ?? 0) - (second.orderIndex ?? 0)).map((group) => (
                        <option value={group.code} key={group.code}>{group.displayName || group.code}</option>
                      ))}
                    </select>
                  </div>
                ) : null}

                {selectedGroup ? (
                  <div className='table-responsive admin-users-table'>
                    <table className='table mb-0'>
                      <thead>
                        <tr>
                          <th className='text-12 fw-medium text-neutral-500 py-16 px-20'><StaticText text={"Fənn"} /></th>
                          <th className='text-12 fw-medium text-neutral-500 py-16 px-20'><StaticText text={"Sual sayı"} /></th>
                          <th className='text-12 fw-medium text-neutral-500 py-16 px-20'><StaticText text={"Qapalı"} /></th>
                          <th className='text-12 fw-medium text-neutral-500 py-16 px-20'><StaticText text={"Açıq"} /></th>
                          <th className='text-12 fw-medium text-neutral-500 py-16 px-20'><StaticText text={"Maks. bal"} /></th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...selectedGroup.subjects]
                          .sort((first, second) => (first.slotIndex ?? 0) - (second.slotIndex ?? 0))
                          .map((slot) => (
                            <tr key={slot.slotIndex}>
                              <td className='py-16 px-20 text-14 text-neutral-500'>{subjectLabel(slot.subjectCode)}</td>
                              <td className='py-16 px-20 text-14 text-neutral-500'>{slot.questionCount}</td>
                              <td className='py-16 px-20 text-14 text-neutral-500'>{slot.closedCount ?? "-"}</td>
                              <td className='py-16 px-20 text-14 text-neutral-500'>{slot.openCount ?? "-"}</td>
                              <td className='py-16 px-20 text-14 text-neutral-500'>{slot.maxPoints}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                ) : multiGroup ? (
                  <p className='text-13 text-neutral-400 mb-0'><StaticText text={"Fənn bölgüsünü görmək üçün ixtisas qrupu seçin."} /></p>
                ) : null}
              </>
            ) : null}
          </div>
        ) : null}
      </div>

      {confirmOpen ? (
        <div className='modal fade show d-block' tabIndex='-1' role='dialog' style={{ background: "rgba(15, 23, 42, 0.48)" }}>
          <div className='modal-dialog modal-dialog-centered' role='document'>
            <div className='modal-content rounded-12 border-0'>
              <div className='modal-header border-neutral-30'>
                <h5 className='modal-title text-18 fw-semibold text-neutral-500'><StaticText text={"İmtahana başlanılsın?"} /></h5>
                <button type='button' className='btn-close' aria-label='Close' onClick={() => setConfirmOpen(false)} disabled={isStarting}></button>
              </div>
              <div className='modal-body'>
                <p className='text-14 text-neutral-500 mb-8'>
                  {examName(blueprint)}{selectedGroup && multiGroup ? ` — ${selectedGroup.displayName || selectedGroup.code}` : ""}
                </p>
                <p className='text-14 text-neutral-400 mb-0'>
                  <StaticText text={"Bu, vaxt məhdudiyyətli rəsmi imtahandır. Başladıqdan sonra geri sayım dərhal başlayır."} />
                  {blueprint?.durationMinutes ? ` (${blueprint.durationMinutes} ` : ""}
                  {blueprint?.durationMinutes ? <StaticText text={"dəqiqə"} /> : null}
                  {blueprint?.durationMinutes ? ")" : ""}
                </p>
              </div>
              <div className='modal-footer border-neutral-30'>
                <button type='button' className='px-20 py-10 border border-neutral-40 rounded-pill text-14 text-neutral-500 bg-white' onClick={() => setConfirmOpen(false)} disabled={isStarting}>
                  <StaticText text={"Ləğv et"} />
                </button>
                <button type='button' className='btn btn-main rounded-pill px-24' onClick={start} disabled={isStarting}>
                  {isStarting ? <StaticText text={"Başlayır..."} /> : <StaticText text={"Bəli, başla"} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ChildOfficialExamsPage;
