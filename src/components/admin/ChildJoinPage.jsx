"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { redeemOrganizationInvite } from "@/lib/api";
import StaticText from "@/components/StaticText";

// Terminal session statuses: the attempt is over. Redeeming a one-shot org test the student
// already finished returns the finished session (get-or-resume), so we detect it and show a
// clear "already completed → view results" message instead of dropping into the read-only runner.
const TERMINAL_SESSION_STATUSES = new Set(["SUBMITTED", "EXPIRED", "ABANDONED"]);

const SESSION_BASE_PATH = "/admin/exam-session";

// Org invite codes are SecureCodeGenerator 8-char, ambiguity-free uppercase alphanumerics.
const normalizeCode = (value) => String(value || "").trim().toUpperCase();

const ChildJoinPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [code, setCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState("");
  const [completedSessionId, setCompletedSessionId] = useState("");

  // Allow a deep link like /admin/join?code=ABCD1234 (e.g. a teacher shares a full URL).
  useEffect(() => {
    const presetCode = searchParams?.get("code");
    if (presetCode) setCode(normalizeCode(presetCode));
  }, [searchParams]);

  const join = async (event) => {
    event.preventDefault();
    if (isJoining) return;
    setError("");
    setCompletedSessionId("");

    const trimmed = normalizeCode(code);
    if (!trimmed) {
      setError("Zəhmət olmasa dəvət kodunu daxil edin.");
      return;
    }

    setIsJoining(true);
    try {
      const session = await redeemOrganizationInvite(trimmed);
      const sessionId = session?.id || session?.sessionId;
      if (!sessionId) {
        setError("Test sessiyası başladıla bilmədi.");
        setIsJoining(false);
        return;
      }
      // A one-shot org test the student already finished resumes the terminal session; surface
      // that clearly rather than navigating straight into the read-only runner.
      if (TERMINAL_SESSION_STATUSES.has(session?.status)) {
        setCompletedSessionId(sessionId);
        setIsJoining(false);
        return;
      }
      router.push(`${SESSION_BASE_PATH}/${sessionId}`);
    } catch (requestError) {
      // A wrong/unknown code returns a dynamic 404 ("Invite not found: <code>") that the API-message
      // localizer can't map — show a clean localized message. Other statuses already carry a localized
      // message (§6c) and are shown as-is.
      if (requestError?.status === 404) {
        setError("Belə bir dəvət kodu tapılmadı. Kodu yoxlayıb yenidən cəhd edin.");
      } else {
        setError(requestError?.message || "Dəvət koduna qoşulmaq alınmadı.");
      }
      setIsJoining(false);
    }
  };

  const viewCompletedResult = () => {
    if (completedSessionId) router.push(`${SESSION_BASE_PATH}/${completedSessionId}`);
  };

  return (
    <div className='px-24 py-24'>
      <div className='bg-white rounded-10 px-24 py-24'>
        <div className='mb-24'>
          <h4 className='fw-semibold text-neutral-500 text-20 mb-4'><StaticText text={"Join by code"} /></h4>
          <p className='text-14 text-neutral-400 mb-0'><StaticText text={"Kurs, repetitor və ya məktəbdən aldığınız dəvət kodunu daxil edərək testə qoşulun."} /></p>
        </div>

        {error ? <div className='alert alert-danger text-14 py-10 mb-16'>{error}</div> : null}

        {completedSessionId ? (
          <div className='alert alert-info d-flex flex-wrap align-items-center justify-content-between gap-12 text-14 py-12 mb-16'>
            <span><StaticText text={"Bu testi artıq tamamlamısınız. Nəticələrinizə baxa bilərsiniz."} /></span>
            <button type='button' className='btn btn-main rounded-pill px-20' onClick={viewCompletedResult}>
              <StaticText text={"Nəticələrə bax"} />
            </button>
          </div>
        ) : null}

        <form onSubmit={join}>
          <div className='row gy-4 align-items-end'>
            <div className='col-md-6'>
              <label className='text-13 fw-medium text-neutral-500 mb-8 d-block' htmlFor='join-code'>
                <StaticText text={"Dəvət kodu"} /> <span className='text-danger-600'>*</span>
              </label>
              <input
                id='join-code'
                className='common-input rounded-pill text-uppercase'
                value={code}
                maxLength={16}
                autoComplete='off'
                placeholder='ABCD1234'
                disabled={isJoining}
                onChange={(changeEvent) => { if (error) setError(""); setCode(normalizeCode(changeEvent.target.value)); }}
              />
            </div>
            <div className='col-md-6'>
              <button type='submit' className='btn btn-main rounded-pill px-24' disabled={isJoining || !code.trim()}>
                {isJoining ? <StaticText text={"Qoşulur..."} /> : <StaticText text={"Testə qoşul"} />}
              </button>
            </div>
          </div>
        </form>

        <p className='text-13 text-neutral-400 mb-0 mt-20'>
          <StaticText text={"Qoşulduqdan sonra test dərhal başlayır. Vaxt məhdudiyyəti varsa, geri sayım qoşulan andan başlayır."} />
        </p>
      </div>
    </div>
  );
};

export default ChildJoinPage;
