"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import AdminRefreshButton from "@/components/admin/AdminRefreshButton";
import { useAuth } from "@/hooks/useAuth";
import { getPrimaryRole, getUserRoles } from "@/lib/authRoles";
import {
  fetchGrades,
  fetchMyOrganizations,
  fetchMyProfile,
  fetchParentProfile,
  fetchStudentParents,
  fetchStudentProfile,
  revokeStudentParent,
  updateMyProfile,
  updateParentProfile,
  updateStudentProfile,
} from "@/lib/api";
import { formatDateTime as formatDate } from "@/lib/format";
import StaticText from "@/components/StaticText";
import AdminCardSkeleton from "@/components/admin/AdminCardSkeleton";
import StaticOption from "@/components/StaticOption";



// Only the editable fields live in the form; the verified flags come from the saved `basicInfo`.
const emptyBasicForm = { fullName: "", email: "", phone: "" };

const AccountProfilePage = () => {
  const { user, loadProfile } = useAuth();
  const primaryRole = getPrimaryRole(user);
  const roles = getUserRoles(user);
  const [basicInfo, setBasicInfo] = useState(null);
  const [basicForm, setBasicForm] = useState(emptyBasicForm);
  const [isSavingBasic, setIsSavingBasic] = useState(false);
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
      // Basic info (name/email/phone) is role-agnostic — every authenticated user has it.
      const profile = await fetchMyProfile().catch(() => null);
      if (profile) {
        setBasicInfo(profile);
        setBasicForm({
          fullName: profile.fullName || "",
          email: profile.email || "",
          phone: profile.phone || "",
        });
      }
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
      setError(requestError?.message || "Profil məlumatı yüklənmədi.");
    } finally {
      setIsLoading(false);
    }
  }, [primaryRole]);

  useEffect(() => {
    load();
  }, [load]);

  const saveBasicInfo = async (event) => {
    event.preventDefault();
    setIsSavingBasic(true);
    setNotice("");
    setError("");

    // Send only non-empty values (an empty string would fail the backend's @Email/@Pattern; the
    // backend applies only non-null fields). A user must keep at least one contact channel.
    const fullName = basicForm.fullName.trim();
    const email = basicForm.email.trim();
    const phone = basicForm.phone.trim();
    if (!email && !phone) {
      setError("Ən azı bir əlaqə vasitəsi (e-poçt və ya telefon) qalmalıdır.");
      setIsSavingBasic(false);
      return;
    }

    const payload = {};
    if (fullName) payload.fullName = fullName;
    if (email) payload.email = email;
    if (phone) payload.phone = phone;

    try {
      const updated = await updateMyProfile(payload);
      setBasicInfo(updated);
      setBasicForm({
        fullName: updated.fullName || "",
        email: updated.email || "",
        phone: updated.phone || "",
      });
      // Refresh the app-wide user so the sidebar greeting / profile dropdown pick up the new name.
      await loadProfile().catch(() => {});
      setNotice("Profiliniz yeniləndi.");
    } catch (requestError) {
      setError(requestError?.message || "Profil yenilənmədi.");
    } finally {
      setIsSavingBasic(false);
    }
  };

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
      setNotice("Şagird profili yeniləndi.");
    } catch (requestError) {
      setError(requestError?.message || "Şagird profili yenilənmədi.");
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
      setNotice("Valideyn profili yeniləndi.");
    } catch (requestError) {
      setError(requestError?.message || "Valideyn profili yenilənmədi.");
    } finally {
      setIsSaving(false);
    }
  };

  const removeParent = async (parentId) => {
    if (!window.confirm("Bu valideynin nəticələrinizə və tərəqqinizə girişini ləğv edək?")) return;
    setError("");
    setNotice("");
    try {
      await revokeStudentParent(parentId);
      setParents((current) => current.filter((item) => item.parentId !== parentId));
      setNotice("Valideyn girişi ləğv edildi.");
    } catch (requestError) {
      setError(requestError?.message || "Valideyn girişi ləğv edilmədi.");
    }
  };

  return (
    <div className='px-24 py-24'>
      <div className='bg-white rounded-10 px-24 py-24'>
        <div className='d-flex flex-wrap align-items-start justify-content-between gap-16 mb-24'>
          <div>
            <h4 className='fw-semibold text-neutral-500 text-20 mb-4'><StaticText text={"Profile"} /></h4>
            <p className='text-14 text-neutral-400 mb-0'><StaticText text={"Account and role-specific profile information."} /></p>
          </div>
          <AdminRefreshButton isLoading={isLoading} onClick={load} />
        </div>

        {notice ? <div className='alert alert-success text-14 py-10 mb-16'>{notice}</div> : null}
        {error ? <div className='alert alert-danger text-14 py-10 mb-16'>{error}</div> : null}

        <div className='row gy-3 mb-24'>
          <div className='col-md-6'><div className='border border-neutral-30 rounded-10 p-16 h-100'><span className='text-13 text-neutral-400 d-block'><StaticText text={"Account ID"} /></span><strong className='text-14 text-neutral-500 text-break'>{user?.id || user?.userId || "-"}</strong></div></div>
          <div className='col-md-6'><div className='border border-neutral-30 rounded-10 p-16 h-100'><span className='text-13 text-neutral-400 d-block'><StaticText text={"Roles"} /></span><strong className='text-14 text-neutral-500'>{roles.map((role) => role.replaceAll("_", " ")).join(", ") || "-"}</strong></div></div>
        </div>

        {isLoading ? (
          <AdminCardSkeleton rows={4} />
        ) : basicInfo ? (
          <form className='border border-neutral-30 rounded-10 p-20 mb-24' onSubmit={saveBasicInfo}>
            <h5 className='text-16 fw-semibold text-neutral-500 mb-4'><StaticText text={"Basic information"} /></h5>
            <p className='text-13 text-neutral-400 mb-16'><StaticText text={"E-poçt və ya telefon nömrənizi dəyişsəniz, onu yenidən təsdiqləmək lazımdır."} /></p>
            <div className='row gy-3'>
              <div className='col-md-6'>
                <label className='text-14 text-neutral-500 fw-medium mb-8' htmlFor='profile-fullName'><StaticText text={"Full name"} /></label>
                <input
                  id='profile-fullName'
                  className='common-input rounded-pill'
                  maxLength={150}
                  value={basicForm.fullName}
                  onChange={(event) => setBasicForm((current) => ({ ...current, fullName: event.target.value }))}
                />
              </div>
              <div className='col-md-6'>
                <label className='text-14 text-neutral-500 fw-medium mb-8 d-flex align-items-center gap-8' htmlFor='profile-email'>
                  <StaticText text={"Email"} />
                  {/* Badge reflects the SAVED value; editing the field hides it — the change will need re-verification. */}
                  {basicForm.email.trim() && basicForm.email.trim() === (basicInfo.email || "") ? (
                    basicInfo.emailVerified
                      ? <span className='text-12 fw-medium px-8 py-2 rounded-pill bg-success-100 text-success-600'><StaticText text={"Təsdiqlənib"} /></span>
                      : <span className='text-12 fw-medium px-8 py-2 rounded-pill bg-warning-100 text-warning-600'><StaticText text={"Təsdiqlənməyib"} /></span>
                  ) : null}
                </label>
                <input
                  id='profile-email'
                  type='email'
                  className='common-input rounded-pill'
                  maxLength={255}
                  value={basicForm.email}
                  onChange={(event) => setBasicForm((current) => ({ ...current, email: event.target.value }))}
                />
              </div>
              <div className='col-md-6'>
                <label className='text-14 text-neutral-500 fw-medium mb-8 d-flex align-items-center gap-8' htmlFor='profile-phone'>
                  <StaticText text={"Phone"} />
                  {basicForm.phone.trim() && basicForm.phone.trim() === (basicInfo.phone || "") ? (
                    basicInfo.phoneVerified
                      ? <span className='text-12 fw-medium px-8 py-2 rounded-pill bg-success-100 text-success-600'><StaticText text={"Təsdiqlənib"} /></span>
                      : <span className='text-12 fw-medium px-8 py-2 rounded-pill bg-warning-100 text-warning-600'><StaticText text={"Təsdiqlənməyib"} /></span>
                  ) : null}
                </label>
                <input
                  id='profile-phone'
                  className='common-input rounded-pill'
                  maxLength={32}
                  placeholder='+994...'
                  value={basicForm.phone}
                  onChange={(event) => setBasicForm((current) => ({ ...current, phone: event.target.value }))}
                />
              </div>
            </div>
            <div className='mt-16'>
              <button type='submit' className='btn btn-main rounded-pill px-24' disabled={isSavingBasic}>
                {isSavingBasic ? <StaticText text={"Saving..."} /> : <StaticText text={"Save"} />}
              </button>
            </div>
          </form>
        ) : null}

        {!isLoading && primaryRole === "child" && studentProfile ? (
          <>
            <form className='border border-neutral-30 rounded-10 p-20 mb-24' onSubmit={saveStudent}>
              <h5 className='text-16 fw-semibold text-neutral-500 mb-16'><StaticText text={"Student profile"} /></h5>
              <div className='row gy-3 align-items-end'>
                <div className='col-md-6'>
                  <label className='text-14 text-neutral-500 fw-medium mb-8'><StaticText text={"Grade"} /></label>
                  <select className='form-select rounded-pill border-neutral-40 text-14 py-11 px-16' value={studentProfile.gradeId || ""} onChange={(event) => setStudentProfile((current) => ({ ...current, gradeId: event.target.value }))}>
                    <StaticOption value='' text={"Keep current / not selected"} />
                    {grades.map((grade) => <option value={grade.id} key={grade.id}>{grade.nameAz || grade.code}</option>)}
                  </select>
                </div>
                <div className='col-md-4'>
                  <label className='d-flex align-items-center gap-10 py-11 mb-0 text-14 text-neutral-500'>
                    <input type='checkbox' checked={Boolean(studentProfile.guardianConsent)} onChange={(event) => setStudentProfile((current) => ({ ...current, guardianConsent: event.target.checked }))} />
                    <StaticText text={"Guardian consent"} />
                  </label>
                </div>
                <div className='col-md-2'><button type='submit' className='btn btn-main rounded-pill w-100' disabled={isSaving}>{isSaving ? <StaticText text={"Saving..."} /> : <StaticText text={"Save"} />}</button></div>
              </div>
            </form>

            <div className='border border-neutral-30 rounded-10 p-20'>
              <h5 className='text-16 fw-semibold text-neutral-500 mb-4'><StaticText text={"Linked parents"} /></h5>
              <p className='text-13 text-neutral-400 mb-16'><StaticText text={"You can withdraw a parent's access at any time."} /></p>
              {parents.length ? (
                <div className='d-flex flex-column gap-10'>
                  {parents.map((parent) => (
                    <div className='d-flex flex-wrap align-items-center justify-content-between gap-12 border border-neutral-30 rounded-8 px-16 py-12' key={parent.parentId}>
                      <div><strong className='text-14 text-neutral-500 d-block'>{parent.parentName || parent.parentId}</strong><span className='text-12 text-neutral-400'><StaticText text={"Linked"} /> {formatDate(parent.linkedAt)}</span></div>
                      <button type='button' className='px-14 py-8 border border-neutral-40 rounded-pill text-13 text-danger bg-white' onClick={() => removeParent(parent.parentId)}><StaticText text={"Revoke access"} /></button>
                    </div>
                  ))}
                </div>
              ) : <p className='text-14 text-neutral-400 mb-0'><StaticText text={"No linked parents."} /></p>}
            </div>
          </>
        ) : null}

        {!isLoading && primaryRole === "parent" && parentProfile ? (
          <form className='border border-neutral-30 rounded-10 p-20' onSubmit={saveParent}>
            <h5 className='text-16 fw-semibold text-neutral-500 mb-16'><StaticText text={"Parent profile"} /></h5>
            <div className='d-flex flex-wrap align-items-center justify-content-between gap-16'>
              <label className='d-flex align-items-center gap-10 mb-0 text-14 text-neutral-500'>
                <input type='checkbox' checked={Boolean(parentProfile.notifyOnChildResult)} onChange={(event) => setParentProfile((current) => ({ ...current, notifyOnChildResult: event.target.checked }))} />
                <StaticText text={"Notify me when a linked learner completes a test"} />
              </label>
              <button type='submit' className='btn btn-main rounded-pill px-24' disabled={isSaving}>{isSaving ? <StaticText text={"Saving..."} /> : <StaticText text={"Save"} />}</button>
            </div>
          </form>
        ) : null}

        {!isLoading && primaryRole === "organization" ? (
          <div className='border border-neutral-30 rounded-10 p-20'>
            <div className='d-flex flex-wrap align-items-center justify-content-between gap-12 mb-16'>
              <h5 className='text-16 fw-semibold text-neutral-500 mb-0'><StaticText text={"Organizations"} /></h5>
              <Link href='/admin/organizations' className='btn btn-main rounded-pill px-20'><StaticText text={"Manage organizations"} /></Link>
            </div>
            {organizations.length ? organizations.map((organization) => (
              <div className='d-flex justify-content-between gap-12 border-top border-neutral-30 py-12' key={organization.id}>
                <span className='text-14 text-neutral-500'>{organization.name}</span>
                <span className='text-13 text-neutral-400'>{organization.type} · {organization.status}</span>
              </div>
            )) : <p className='text-14 text-neutral-400 mb-0'><StaticText text={"No organizations found."} /></p>}
          </div>
        ) : null}

        {!isLoading && primaryRole === "admin" ? (
          <div className='border border-neutral-30 rounded-10 p-20'>
            <h5 className='text-16 fw-semibold text-neutral-500 mb-4'><StaticText text={"Administrator account"} /></h5>
            <p className='text-14 text-neutral-400 mb-0'><StaticText text={"Digər istifadəçilərin profilləri İstifadəçilər səhifəsindən idarə olunur."} /></p>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default AccountProfilePage;
