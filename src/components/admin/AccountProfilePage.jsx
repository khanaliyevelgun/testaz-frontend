"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import AdminRefreshButton from "@/components/admin/AdminRefreshButton";
import { useAuth } from "@/hooks/useAuth";
import { getPrimaryRole, getUserRoles } from "@/lib/authRoles";
import {
  fetchGrades,
  fetchMyOrganizations,
  fetchParentProfile,
  fetchStudentParents,
  fetchStudentProfile,
  revokeStudentParent,
  updateParentProfile,
  updateStudentProfile,
} from "@/lib/api";

const formatDate = (value) => {
  if (!value) return "-";
  return new Intl.DateTimeFormat("az-AZ", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
};

const AccountProfilePage = () => {
  const { user } = useAuth();
  const primaryRole = getPrimaryRole(user);
  const roles = getUserRoles(user);
  const [studentProfile, setStudentProfile] = useState(null);
  const [parentProfile, setParentProfile] = useState(null);
  const [parents, setParents] = useState([]);
  const [grades, setGrades] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      if (primaryRole === "child") {
        const [profileResponse, gradeResponse, parentResponse] = await Promise.all([
          fetchStudentProfile(),
          fetchGrades(),
          fetchStudentParents(),
        ]);
        setStudentProfile(profileResponse || { gradeId: "", guardianConsent: false });
        setGrades(gradeResponse || []);
        setParents(parentResponse || []);
      } else if (primaryRole === "parent") {
        setParentProfile(await fetchParentProfile());
      } else if (primaryRole === "organization") {
        setOrganizations(await fetchMyOrganizations());
      }
    } catch (requestError) {
      setError(requestError?.message || "Profile information could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }, [primaryRole]);

  useEffect(() => {
    load();
  }, [load]);

  const saveStudent = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setNotice("");
    setError("");
    try {
      const payload = {
        guardianConsent: Boolean(studentProfile.guardianConsent),
      };
      if (studentProfile.gradeId !== "" && studentProfile.gradeId != null) {
        payload.gradeId = Number(studentProfile.gradeId);
      }
      const updated = await updateStudentProfile(payload);
      setStudentProfile(updated);
      setNotice("Student profile updated.");
    } catch (requestError) {
      setError(requestError?.message || "Student profile could not be updated.");
    } finally {
      setIsSaving(false);
    }
  };

  const saveParent = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setNotice("");
    setError("");
    try {
      setParentProfile(await updateParentProfile({ notifyOnChildResult: Boolean(parentProfile?.notifyOnChildResult) }));
      setNotice("Parent profile updated.");
    } catch (requestError) {
      setError(requestError?.message || "Parent profile could not be updated.");
    } finally {
      setIsSaving(false);
    }
  };

  const removeParent = async (parentId) => {
    if (!window.confirm("Remove this parent's access to your results and progress?")) return;
    setError("");
    setNotice("");
    try {
      await revokeStudentParent(parentId);
      setParents((current) => current.filter((item) => item.parentId !== parentId));
      setNotice("Parent access revoked.");
    } catch (requestError) {
      setError(requestError?.message || "Parent access could not be revoked.");
    }
  };

  return (
    <div className='px-24 py-24'>
      <div className='bg-white rounded-10 px-24 py-24'>
        <div className='d-flex flex-wrap align-items-start justify-content-between gap-16 mb-24'>
          <div>
            <h4 className='fw-semibold text-neutral-500 text-20 mb-4'>Profile</h4>
            <p className='text-14 text-neutral-400 mb-0'>Account and role-specific profile information.</p>
          </div>
          <AdminRefreshButton isLoading={isLoading} onClick={load} />
        </div>

        {notice ? <div className='alert alert-success text-14 py-10 mb-16'>{notice}</div> : null}
        {error ? <div className='alert alert-danger text-14 py-10 mb-16'>{error}</div> : null}

        <div className='row gy-3 mb-24'>
          <div className='col-md-6'><div className='border border-neutral-30 rounded-10 p-16 h-100'><span className='text-13 text-neutral-400 d-block'>Name</span><strong className='text-16 text-neutral-500'>{user?.name || user?.fullName || "-"}</strong></div></div>
          <div className='col-md-6'><div className='border border-neutral-30 rounded-10 p-16 h-100'><span className='text-13 text-neutral-400 d-block'>Account ID</span><strong className='text-14 text-neutral-500 text-break'>{user?.id || user?.userId || "-"}</strong></div></div>
          <div className='col-md-6'><div className='border border-neutral-30 rounded-10 p-16 h-100'><span className='text-13 text-neutral-400 d-block'>Roles</span><strong className='text-14 text-neutral-500'>{roles.map((role) => role.replaceAll("_", " ")).join(", ") || "-"}</strong></div></div>
          <div className='col-md-6'><div className='border border-neutral-30 rounded-10 p-16 h-100'><span className='text-13 text-neutral-400 d-block'>Contact</span><strong className='text-14 text-neutral-500'>{user?.email || user?.phone || "-"}</strong></div></div>
        </div>

        {isLoading ? <p className='text-14 text-neutral-400 mb-0'>Loading...</p> : null}

        {!isLoading && primaryRole === "child" && studentProfile ? (
          <>
            <form className='border border-neutral-30 rounded-10 p-20 mb-24' onSubmit={saveStudent}>
              <h5 className='text-16 fw-semibold text-neutral-500 mb-16'>Student profile</h5>
              <div className='row gy-3 align-items-end'>
                <div className='col-md-6'>
                  <label className='text-14 text-neutral-500 fw-medium mb-8'>Grade</label>
                  <select className='form-select rounded-pill border-neutral-40 text-14 py-11 px-16' value={studentProfile.gradeId || ""} onChange={(event) => setStudentProfile((current) => ({ ...current, gradeId: event.target.value }))}>
                    <option value=''>Keep current / not selected</option>
                    {grades.map((grade) => <option value={grade.id} key={grade.id}>{grade.nameAz || grade.code}</option>)}
                  </select>
                </div>
                <div className='col-md-4'>
                  <label className='d-flex align-items-center gap-10 py-11 mb-0 text-14 text-neutral-500'>
                    <input type='checkbox' checked={Boolean(studentProfile.guardianConsent)} onChange={(event) => setStudentProfile((current) => ({ ...current, guardianConsent: event.target.checked }))} />
                    Guardian consent
                  </label>
                </div>
                <div className='col-md-2'><button type='submit' className='btn btn-main rounded-pill w-100' disabled={isSaving}>{isSaving ? "Saving..." : "Save"}</button></div>
              </div>
            </form>

            <div className='border border-neutral-30 rounded-10 p-20'>
              <h5 className='text-16 fw-semibold text-neutral-500 mb-4'>Linked parents</h5>
              <p className='text-13 text-neutral-400 mb-16'>You can withdraw a parent's access at any time.</p>
              {parents.length ? (
                <div className='d-flex flex-column gap-10'>
                  {parents.map((parent) => (
                    <div className='d-flex flex-wrap align-items-center justify-content-between gap-12 border border-neutral-30 rounded-8 px-16 py-12' key={parent.parentId}>
                      <div><strong className='text-14 text-neutral-500 d-block'>{parent.parentName || parent.parentId}</strong><span className='text-12 text-neutral-400'>Linked {formatDate(parent.linkedAt)}</span></div>
                      <button type='button' className='px-14 py-8 border border-neutral-40 rounded-pill text-13 text-danger bg-white' onClick={() => removeParent(parent.parentId)}>Revoke access</button>
                    </div>
                  ))}
                </div>
              ) : <p className='text-14 text-neutral-400 mb-0'>No linked parents.</p>}
            </div>
          </>
        ) : null}

        {!isLoading && primaryRole === "parent" && parentProfile ? (
          <form className='border border-neutral-30 rounded-10 p-20' onSubmit={saveParent}>
            <h5 className='text-16 fw-semibold text-neutral-500 mb-16'>Parent profile</h5>
            <div className='d-flex flex-wrap align-items-center justify-content-between gap-16'>
              <label className='d-flex align-items-center gap-10 mb-0 text-14 text-neutral-500'>
                <input type='checkbox' checked={Boolean(parentProfile.notifyOnChildResult)} onChange={(event) => setParentProfile((current) => ({ ...current, notifyOnChildResult: event.target.checked }))} />
                Notify me when a linked learner completes a test
              </label>
              <button type='submit' className='btn btn-main rounded-pill px-24' disabled={isSaving}>{isSaving ? "Saving..." : "Save"}</button>
            </div>
          </form>
        ) : null}

        {!isLoading && primaryRole === "organization" ? (
          <div className='border border-neutral-30 rounded-10 p-20'>
            <div className='d-flex flex-wrap align-items-center justify-content-between gap-12 mb-16'>
              <h5 className='text-16 fw-semibold text-neutral-500 mb-0'>Organizations</h5>
              <Link href='/admin/organizations' className='btn btn-main rounded-pill px-20'>Manage organizations</Link>
            </div>
            {organizations.length ? organizations.map((organization) => (
              <div className='d-flex justify-content-between gap-12 border-top border-neutral-30 py-12' key={organization.id}>
                <span className='text-14 text-neutral-500'>{organization.name}</span>
                <span className='text-13 text-neutral-400'>{organization.type} · {organization.status}</span>
              </div>
            )) : <p className='text-14 text-neutral-400 mb-0'>No organizations found.</p>}
          </div>
        ) : null}

        {!isLoading && primaryRole === "admin" ? (
          <div className='border border-neutral-30 rounded-10 p-20'>
            <h5 className='text-16 fw-semibold text-neutral-500 mb-4'>Administrator account</h5>
            <p className='text-14 text-neutral-400 mb-0'>User profile changes are managed from the Users page.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default AccountProfilePage;
