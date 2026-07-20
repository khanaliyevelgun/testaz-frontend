"use client";

import { useCallback, useEffect, useState } from "react";
import AdminRefreshButton from "@/components/admin/AdminRefreshButton";
import { fetchNotificationPreferences, updateNotificationPreferences } from "@/lib/api";
import StaticText from "@/components/StaticText";


const AccountSettingsPage = () => {
  const [preferences, setPreferences] = useState({ emailEnabled: false, smsEnabled: false });
  const [hasLoadedPreferences, setHasLoadedPreferences] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      setPreferences((await fetchNotificationPreferences()) || { emailEnabled: false, smsEnabled: false });
      setHasLoadedPreferences(true);
    } catch (requestError) {
      setError(requestError?.message || "Settings could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setNotice("");
    setError("");
    try {
      const updated = await updateNotificationPreferences({
        emailEnabled: Boolean(preferences.emailEnabled),
        smsEnabled: Boolean(preferences.smsEnabled),
      });
      setPreferences(updated || preferences);
      setNotice("Notification settings updated.");
    } catch (requestError) {
      setError(requestError?.message || "Settings could not be updated.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className='px-24 py-24'>
      <div className='bg-white rounded-10 px-24 py-24'>
        <div className='d-flex flex-wrap align-items-start justify-content-between gap-16 mb-24'>
          <div>
            <h4 className='fw-semibold text-neutral-500 text-20 mb-4'><StaticText text={"Settings"} /></h4>
            <p className='text-14 text-neutral-400 mb-0'><StaticText text={"Choose how account notifications are delivered."} /></p>
          </div>
          <AdminRefreshButton isLoading={isLoading} onClick={load} />
        </div>
        {notice ? <div className='alert alert-success text-14 py-10 mb-16'>{notice}</div> : null}
        {error ? <div className='alert alert-danger text-14 py-10 mb-16'>{error}</div> : null}
        {isLoading ? <p className='text-14 text-neutral-400 mb-0'><StaticText text={"Loading..."} /></p> : hasLoadedPreferences ? (
          <form onSubmit={save}>
            <div className='d-flex flex-column gap-12 mb-24'>
              <label className='d-flex align-items-start justify-content-between gap-16 border border-neutral-30 rounded-10 px-18 py-16'>
                <span><strong className='text-14 text-neutral-500 d-block'><StaticText text={"Email notifications"} /></strong><span className='text-13 text-neutral-400'><StaticText text={"Receive result, invitation and exam updates by email."} /></span></span>
                <input type='checkbox' checked={Boolean(preferences.emailEnabled)} onChange={(event) => setPreferences((current) => ({ ...current, emailEnabled: event.target.checked }))} />
              </label>
              <label className='d-flex align-items-start justify-content-between gap-16 border border-neutral-30 rounded-10 px-18 py-16'>
                <span><strong className='text-14 text-neutral-500 d-block'><StaticText text={"SMS notifications"} /></strong><span className='text-13 text-neutral-400'><StaticText text={"Receive supported account updates by SMS."} /></span></span>
                <input type='checkbox' checked={Boolean(preferences.smsEnabled)} onChange={(event) => setPreferences((current) => ({ ...current, smsEnabled: event.target.checked }))} />
              </label>
              <div className='border border-neutral-30 rounded-10 px-18 py-16'>
                <strong className='text-14 text-neutral-500 d-block'><StaticText text={"In-app notifications"} /></strong>
                <span className='text-13 text-neutral-400'><StaticText text={"Always enabled so important activity is visible in your inbox."} /></span>
              </div>
            </div>
            <button type='submit' className='btn btn-main rounded-pill px-24' disabled={isSaving}>{isSaving ? <StaticText text={"Saving..."} /> : <StaticText text={"Save settings"} />}</button>
          </form>
        ) : <p className='text-14 text-neutral-400 mb-0'><StaticText text={"Settings are unavailable. Refresh to try again."} /></p>}
      </div>
    </div>
  );
};

export default AccountSettingsPage;
