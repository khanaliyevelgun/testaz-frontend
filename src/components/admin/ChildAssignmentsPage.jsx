"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AdminRefreshButton from "@/components/admin/AdminRefreshButton";
import {
  fetchExamPreview,
  fetchMyAssignedExams,
  fetchStudentInvitations,
  respondStudentInvitation,
} from "@/lib/api";
import StaticText from "@/components/StaticText";


const formatDate = (value) => {
  if (!value) return "-";
  return new Intl.DateTimeFormat("az-AZ", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
};

const ChildAssignmentsPage = () => {
  const [exams, setExams] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [preview, setPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = async () => {
    setIsLoading(true);
    setError("");
    try {
      const [examResponse, invitationResponse] = await Promise.all([
        fetchMyAssignedExams(),
        fetchStudentInvitations("PENDING"),
      ]);
      setExams(examResponse);
      setInvitations(invitationResponse);
    } catch (requestError) {
      setError(requestError?.message || "Assignments could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const respond = async (invitationId, approved) => {
    setNotice("");
    setError("");
    try {
      const result = await respondStudentInvitation(invitationId, approved);
      setNotice(result?.approved ? "Invitation approved." : "Invitation rejected.");
      await load();
    } catch (requestError) {
      setError(requestError?.message || "Invitation could not be updated.");
    }
  };

  const openPreview = async (examCode) => {
    setPreview({ isLoading: true });
    setError("");
    try {
      const response = await fetchExamPreview(examCode);
      setPreview(response);
    } catch (requestError) {
      setPreview(null);
      setError(requestError?.message || "Preview could not be loaded.");
    }
  };

  return (
    <div className='px-24 py-24'>
      <div className='bg-white rounded-10 px-24 py-24'>
        <div className='d-flex flex-wrap align-items-center justify-content-between gap-16 mb-24'>
          <div>
            <h4 className='fw-semibold text-neutral-500 text-20 mb-4'><StaticText text={"Assignments"} /></h4>
            <p className='text-14 text-neutral-400 mb-0'><StaticText text={"Parent invitations and assigned exams appear here."} /></p>
          </div>
          <AdminRefreshButton isLoading={isLoading} onClick={load} />
        </div>

        {notice ? <div className='alert alert-success text-14 py-10 mb-16'>{notice}</div> : null}
        {error ? <div className='alert alert-danger text-14 py-10 mb-16'>{error}</div> : null}

        {invitations.length ? (
          <div className='mb-24'>
            <h5 className='text-16 fw-semibold text-neutral-500 mb-12'><StaticText text={"Parent invitations"} /></h5>
            <div className='d-flex flex-column gap-10'>
              {invitations.map((invitation) => (
                <div className='border border-neutral-30 rounded-8 px-16 py-14 d-flex flex-wrap align-items-center justify-content-between gap-12' key={invitation.invitationId}>
                  <div>
                    <strong className='text-15 text-neutral-500 d-block'>{invitation.counterpartName || invitation.parentId}</strong>
                    {invitation.message ? <span className='text-14 text-neutral-400'>{invitation.message}</span> : null}
                  </div>
                  <div className='d-flex gap-8'>
                    <button type='button' className='btn btn-main rounded-pill px-18 py-8' onClick={() => respond(invitation.invitationId, true)}><StaticText text={"Approve"} /></button>
                    <button type='button' className='px-18 py-8 border border-neutral-40 rounded-pill text-14 text-neutral-500 bg-white' onClick={() => respond(invitation.invitationId, false)}><StaticText text={"Reject"} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <h5 className='text-16 fw-semibold text-neutral-500 mb-12'><StaticText text={"Assigned exams"} /></h5>
        <div className='table-responsive admin-users-table'>
          <table className='table mb-0'>
            <thead>
              <tr>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'><StaticText text={"Exam"} /></th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'><StaticText text={"Code"} /></th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'><StaticText text={"State"} /></th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'><StaticText text={"Duration"} /></th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'><StaticText text={"Expires"} /></th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20 text-end'><StaticText text={"Action"} /></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td className='py-20 px-20 text-neutral-400' colSpan='6'><StaticText text={"Loading..."} /></td></tr>
              ) : exams.length ? (
                exams.map((exam) => (
                  <tr key={exam.examId || exam.examCode}>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{exam.title || <StaticText text={"Untitled exam"} />}</td>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{exam.examCode}</td>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{exam.state || "-"}</td>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{exam.durationMinutes ? `${exam.durationMinutes} min` : <StaticText text={"Untimed"} />}</td>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{formatDate(exam.expiresAt)}</td>
                    <td className='py-16 px-20'>
                      <div className='d-flex justify-content-end gap-8'>
                        <button type='button' className='px-14 py-8 border border-neutral-40 rounded-pill text-14 text-neutral-500 bg-white' onClick={() => openPreview(exam.examCode)}><StaticText text={"Preview"} /></button>
                        {exam.resumable && exam.sessionId ? (
                          <Link href={`/admin/exam-session/${exam.sessionId}`} className='btn btn-main rounded-pill px-18 py-8'><StaticText text={"Continue"} /></Link>
                        ) : exam.state !== "SUBMITTED" && exam.state !== "EXPIRED" ? (
                          <Link href={`/admin/exams/take/${exam.examCode}`} className='btn btn-main rounded-pill px-18 py-8'><StaticText text={"Start"} /></Link>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td className='py-20 px-20 text-neutral-400' colSpan='6'><StaticText text={"No assigned exams found."} /></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {preview ? (
        <div className='modal fade show d-block' tabIndex='-1' role='dialog' style={{ background: "rgba(15, 23, 42, 0.48)" }}>
          <div className='modal-dialog modal-dialog-centered modal-lg' role='document'>
            <div className='modal-content rounded-12 border-0'>
              <div className='modal-header border-neutral-30'>
                <h5 className='modal-title text-18 fw-semibold text-neutral-500'><StaticText text={"Exam preview"} /></h5>
                <button type='button' className='btn-close' aria-label='Close' onClick={() => setPreview(null)}></button>
              </div>
              <div className='modal-body'>
                {preview.isLoading ? <p className='text-14 text-neutral-400 mb-0'><StaticText text={"Loading..."} /></p> : (
                  <>
                    <h6 className='text-18 fw-semibold text-neutral-500 mb-8'>{preview.title || <StaticText text={"Untitled exam"} />}</h6>
                    {preview.description ? <p className='text-14 text-neutral-400'>{preview.description}</p> : null}
                    <div className='row gy-3 mb-16'>
                      <div className='col-md-4'><div className='border border-neutral-30 rounded-8 p-14'><span className='text-13 text-neutral-400 d-block'><StaticText text={"Questions"} /></span><strong>{preview.totalQuestions ?? "-"}</strong></div></div>
                      <div className='col-md-4'><div className='border border-neutral-30 rounded-8 p-14'><span className='text-13 text-neutral-400 d-block'><StaticText text={"Duration"} /></span><strong>{preview.durationMinutes ? `${preview.durationMinutes} min` : <StaticText text={"Untimed"} />}</strong></div></div>
                      <div className='col-md-4'><div className='border border-neutral-30 rounded-8 p-14'><span className='text-13 text-neutral-400 d-block'><StaticText text={"Creator"} /></span><strong>{preview.creatorName || "-"}</strong></div></div>
                    </div>
                    <p className='text-14 text-neutral-500 mb-8'><StaticText text={"Subjects:"} /> {(preview.subjects || []).join(", ") || "-"}</p>
                    <p className='text-14 text-neutral-500 mb-0'><StaticText text={"Topics:"} /> {(preview.topics || []).join(", ") || "-"}</p>
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

export default ChildAssignmentsPage;
