"use client";

import { useEffect, useState } from "react";
import AdminRefreshButton from "@/components/admin/AdminRefreshButton";
import {
  becomeParent,
  cancelParentInvitation,
  fetchParentDashboard,
  fetchParentInvitations,
  searchLearners,
  sendParentInvitation,
  unlinkChild,
} from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

const formatDate = (value) => {
  if (!value) return "-";
  return new Intl.DateTimeFormat("az-AZ", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
};

const formatResult = (result) => {
  if (!result) return "No result";
  const percentage = result.percentage != null ? `${Math.round(result.percentage)}%` : "-";
  return `${percentage} (${result.correctCount ?? "-"} / ${result.totalQuestions ?? "-"})`;
};

const ParentChildrenPage = () => {
  const { loadProfile } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [invitations, setInvitations] = useState([]);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    setIsLoading(true);
    setError("");
    try {
      await becomeParent();
      await loadProfile();
      const [dashboardResponse, invitationResponse] = await Promise.all([
        fetchParentDashboard(),
        fetchParentInvitations("PENDING"),
      ]);
      setDashboard(dashboardResponse);
      setInvitations(invitationResponse);
    } catch (requestError) {
      setError(requestError?.message || "Children could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSearch = async (event) => {
    event.preventDefault();
    if (query.trim().length < 2) {
      setError("Search needs at least 2 characters.");
      return;
    }

    setIsSearching(true);
    setError("");
    setNotice("");
    try {
      const results = await searchLearners(query.trim());
      setSearchResults(results);
    } catch (requestError) {
      setError(requestError?.message || "Learners could not be searched.");
    } finally {
      setIsSearching(false);
    }
  };

  const invite = async (learnerId) => {
    setError("");
    setNotice("");
    try {
      await sendParentInvitation({ learnerId, message });
      setNotice("Invitation sent.");
      setMessage("");
      setSearchResults([]);
      await load();
    } catch (requestError) {
      setError(requestError?.message || "Invitation could not be sent.");
    }
  };

  const removeChild = async (learnerId) => {
    setError("");
    setNotice("");
    try {
      await unlinkChild(learnerId);
      setNotice("Child unlinked.");
      await load();
    } catch (requestError) {
      setError(requestError?.message || "Child could not be unlinked.");
    }
  };

  const cancelInvitation = async (invitationId) => {
    if (!window.confirm("Cancel this pending invitation?")) return;
    setError("");
    setNotice("");
    try {
      await cancelParentInvitation(invitationId);
      setNotice("Invitation cancelled.");
      await load();
    } catch (requestError) {
      setError(requestError?.message || "Invitation could not be cancelled.");
    }
  };

  const learners = dashboard?.learners || [];

  return (
    <div className='px-24 py-24'>
      <div className='bg-white rounded-10 px-24 py-24 mb-24'>
        <div className='d-flex flex-wrap align-items-center justify-content-between gap-16 mb-24'>
          <div>
            <h4 className='fw-semibold text-neutral-500 text-20 mb-4'>Children</h4>
            <p className='text-14 text-neutral-400 mb-0'>Search by username, name or email and send a parent-link invitation.</p>
          </div>
          <AdminRefreshButton isLoading={isLoading} onClick={load} />
        </div>

        {notice ? <div className='alert alert-success text-14 py-10 mb-16'>{notice}</div> : null}
        {error ? <div className='alert alert-danger text-14 py-10 mb-16'>{error}</div> : null}

        <form className='row gy-3 align-items-end mb-20' onSubmit={handleSearch}>
          <div className='col-lg-5'>
            <label className='text-14 text-neutral-500 fw-medium mb-8'>Learner search</label>
            <input className='common-input rounded-pill' value={query} onChange={(event) => setQuery(event.target.value)} placeholder='Username, email or name' />
          </div>
          <div className='col-lg-5'>
            <label className='text-14 text-neutral-500 fw-medium mb-8'>Message</label>
            <input className='common-input rounded-pill' value={message} onChange={(event) => setMessage(event.target.value)} maxLength='500' placeholder='Optional note' />
          </div>
          <div className='col-lg-2'>
            <button type='submit' className='btn btn-main rounded-pill w-100' disabled={isSearching}>
              {isSearching ? "Searching..." : "Search"}
            </button>
          </div>
        </form>

        {searchResults.length ? (
          <div className='table-responsive admin-users-table mb-24'>
            <table className='table mb-0'>
              <thead>
                <tr>
                  <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Learner</th>
                  <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Contact</th>
                  <th className='text-12 fw-medium text-neutral-500 py-16 px-20 text-end'>Action</th>
                </tr>
              </thead>
              <tbody>
                {searchResults.map((learner) => (
                  <tr key={learner.id}>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{learner.displayName || learner.id}</td>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{learner.maskedContact || "-"}</td>
                    <td className='py-16 px-20 text-end'>
                      <button type='button' className='btn btn-main rounded-pill px-18 py-8' onClick={() => invite(learner.id)}>Invite</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        <div className='row gy-3'>
          <div className='col-md-6'>
            <div className='border border-neutral-30 rounded-8 p-16 h-100'>
              <span className='text-13 text-neutral-400 d-block mb-4'>Linked children</span>
              <strong className='text-18 text-neutral-500'>{dashboard?.linkedLearnerCount ?? learners.length}</strong>
            </div>
          </div>
          <div className='col-md-6'>
            <div className='border border-neutral-30 rounded-8 p-16 h-100'>
              <span className='text-13 text-neutral-400 d-block mb-4'>Pending invitations</span>
              <strong className='text-18 text-neutral-500'>{dashboard?.pendingInvitationCount ?? invitations.length}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className='bg-white rounded-10 px-24 py-24'>
        <h5 className='text-16 fw-semibold text-neutral-500 mb-16'>Result page</h5>
        {isLoading ? <p className='text-14 text-neutral-400 mb-0'>Loading...</p> : learners.length ? (
          <div className='table-responsive admin-users-table'>
            <table className='table mb-0'>
              <thead>
                <tr>
                  <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Child</th>
                  <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Average</th>
                  <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Latest result</th>
                  <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Scored at</th>
                  <th className='text-12 fw-medium text-neutral-500 py-16 px-20 text-end'>Action</th>
                </tr>
              </thead>
              <tbody>
                {learners.map((learner) => (
                  <tr key={learner.learnerId}>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{learner.name || learner.learnerId}</td>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{learner.averagePercentage != null ? `${Math.round(learner.averagePercentage)}%` : "-"}</td>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{formatResult(learner.latestResult)}</td>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{formatDate(learner.latestResult?.scoredAt)}</td>
                    <td className='py-16 px-20 text-end'>
                      <button type='button' className='px-14 py-8 border border-neutral-40 rounded-pill text-14 text-neutral-500 bg-white' onClick={() => removeChild(learner.learnerId)}>Unlink</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className='text-14 text-neutral-400 mb-0'>No linked children yet.</p>
        )}

        {invitations.length ? (
          <>
            <h5 className='text-16 fw-semibold text-neutral-500 mt-24 mb-12'>Pending invitations</h5>
            <div className='d-flex flex-column gap-10'>
              {invitations.map((invitation) => (
                <div className='border border-neutral-30 rounded-8 px-16 py-12 d-flex flex-wrap align-items-center justify-content-between gap-12' key={invitation.invitationId}>
                  <div>
                    <span className='text-14 text-neutral-500 d-block'>{invitation.counterpartName || invitation.learnerId}</span>
                    <span className='text-13 text-neutral-400'>{formatDate(invitation.createdAt)}</span>
                  </div>
                  <button type='button' className='px-14 py-8 border border-neutral-40 rounded-pill text-13 text-danger bg-white' onClick={() => cancelInvitation(invitation.invitationId)}>
                    Cancel
                  </button>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default ParentChildrenPage;
