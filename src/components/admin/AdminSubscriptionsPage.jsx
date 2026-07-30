"use client";

import { useCallback, useEffect, useState } from "react";
import AdminRefreshButton from "@/components/admin/AdminRefreshButton";
import AdminSearchSelect from "@/components/admin/AdminSearchSelect";
import AdminStatusBadge from "@/components/admin/AdminStatusBadge";
import {
  fetchAdminSubscriptions,
  fetchSubscriptionPlans,
  fetchUsers,
  grantAdminSubscription,
  updateAdminSubscription,
} from "@/lib/api";
import { formatDateTime as formatDate } from "@/lib/format";
import StaticText from "@/components/StaticText";
import AdminTableSkeleton from "@/components/admin/AdminTableSkeleton";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import StaticOption from "@/components/StaticOption";



const PAGE_SIZE = 10;
const defaultMeta = { page: 1, perPage: PAGE_SIZE, total: 0, totalPages: 1 };
const emptyFilters = { payerUserId: "", status: "", planId: "" };
const statuses = ["PENDING", "ACTIVE", "EXPIRED", "CANCELED"];
const emptyGrantForm = { payerUserId: "", payerLabel: "", planCode: "", expiresAt: "" };

// The backend takes an Instant; a `datetime-local` input yields a zone-less
// "YYYY-MM-DDTHH:mm", so it is interpreted in the admin's local zone and sent as UTC.
const toInstant = (localValue) => (localValue ? new Date(localValue).toISOString() : null);

// Inverse of `toInstant` for pre-filling the edit form: an Instant renders back into the
// admin's local zone, trimmed to the minute precision `datetime-local` accepts.
const toLocalInput = (instant) => {
  if (!instant) return "";
  const parsed = new Date(instant);
  if (Number.isNaN(parsed.getTime())) return "";
  const offsetMs = parsed.getTimezoneOffset() * 60000;
  return new Date(parsed.getTime() - offsetMs).toISOString().slice(0, 16);
};

const AdminSubscriptionsPage = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [meta, setMeta] = useState(defaultMeta);
  const [filters, setFilters] = useState(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [plans, setPlans] = useState([]);
  const [grantForm, setGrantForm] = useState(emptyGrantForm);
  const [isGrantOpen, setIsGrantOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const loadSubscriptions = async (page = 1, query = appliedFilters) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetchAdminSubscriptions({
        page,
        perPage: PAGE_SIZE,
        payerUserId: query.payerUserId,
        status: query.status,
        planId: query.planId,
      });
      setSubscriptions(response?.data || []);
      setMeta(response?.meta || { ...defaultMeta, page });
    } catch (requestError) {
      setSubscriptions([]);
      setMeta({ ...defaultMeta, page });
      setError(requestError?.message || "Abunəliklər yüklənmədi.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSubscriptions(1, emptyFilters);
  }, []);

  // Plans back both the grant and the edit plan dropdown. Only ACTIVE plans are
  // offered, matching the backend's `requireActivePlanByCode` on both endpoints.
  useEffect(() => {
    let isMounted = true;

    fetchSubscriptionPlans()
      .then((items) => {
        if (isMounted) setPlans(Array.isArray(items) ? items : []);
      })
      .catch(() => {
        if (isMounted) setPlans([]);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const payerOptions = useCallback(async (search) => {
    const response = await fetchUsers({ page: 1, perPage: 10, search });
    return (response?.data || []).map((user) => ({
      value: user.id,
      label: user.email ? `${user.name} (${user.email})` : user.name,
    }));
  }, []);

  const closeForms = () => {
    setIsGrantOpen(false);
    setEditing(null);
    setFormError("");
  };

  const submitGrant = async (event) => {
    event.preventDefault();
    setFormError("");

    if (!grantForm.payerUserId || !grantForm.planCode) {
      setFormError("İstifadəçi və plan seçilməlidir.");
      return;
    }

    setIsSaving(true);

    try {
      await grantAdminSubscription({
        payerUserId: grantForm.payerUserId,
        planCode: grantForm.planCode,
        expiresAt: toInstant(grantForm.expiresAt),
      });
      setGrantForm(emptyGrantForm);
      closeForms();
      setNotice("Abunəlik verildi.");
      await loadSubscriptions(1, appliedFilters);
    } catch (requestError) {
      setFormError(requestError?.message || "Abunəlik verilmədi.");
    } finally {
      setIsSaving(false);
    }
  };

  const submitEdit = async (event) => {
    event.preventDefault();
    setFormError("");
    setIsSaving(true);

    try {
      // Only changed fields are sent — the backend applies non-null fields only, so
      // omitting an untouched field leaves it exactly as stored.
      await updateAdminSubscription(editing.id, {
        planCode: editing.planCode !== editing.originalPlanCode ? editing.planCode : null,
        status: editing.status !== editing.originalStatus ? editing.status : null,
        expiresAt:
          editing.expiresAt !== editing.originalExpiresAt ? toInstant(editing.expiresAt) : null,
      });
      closeForms();
      setNotice("Abunəlik yeniləndi.");
      await loadSubscriptions(meta.page, appliedFilters);
    } catch (requestError) {
      setFormError(requestError?.message || "Abunəlik yenilənmədi.");
    } finally {
      setIsSaving(false);
    }
  };

  const openEdit = (subscription) => {
    const expiresAt = toLocalInput(subscription.expiresAt);
    setNotice("");
    setFormError("");
    setEditing({
      id: subscription.id,
      payerLabel: subscription.payerName || subscription.payerUserId,
      planCode: subscription.planCode || "",
      originalPlanCode: subscription.planCode || "",
      status: subscription.status || "",
      originalStatus: subscription.status || "",
      expiresAt,
      originalExpiresAt: expiresAt,
    });
  };

  const applyFilters = (event) => {
    event.preventDefault();
    const nextFilters = {
      ...filters,
      payerUserId: filters.payerUserId.trim(),
      planId: filters.planId.trim(),
    };
    setAppliedFilters(nextFilters);
    loadSubscriptions(1, nextFilters);
  };

  const clearFilters = () => {
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    loadSubscriptions(1, emptyFilters);
  };

  return (
    <div className='px-24 py-24'>
      <div className='bg-white rounded-10 px-24 py-24'>
        <div className='d-flex flex-wrap align-items-center justify-content-between gap-16 mb-24'>
          <div>
            <h4 className='fw-semibold text-neutral-500 text-20 mb-4'><StaticText text={"Subscriptions"} /></h4>
            <p className='text-14 text-neutral-400 mb-0'>
              <StaticText text={"Review all customer subscriptions and their entitlement periods."} />
            </p>
          </div>
          <div className='d-flex align-items-center gap-8'>
            <button
              type='button'
              className='btn btn-main rounded-pill d-flex align-items-center gap-8'
              onClick={() => {
                setNotice("");
                setFormError("");
                setIsGrantOpen(true);
              }}
            >
              <i className='ph ph-plus' aria-hidden='true'></i>
              <StaticText text={"Grant subscription"} />
            </button>
            <AdminRefreshButton
              isLoading={isLoading}
              onClick={() => loadSubscriptions(meta.page, appliedFilters)}
            />
          </div>
        </div>

        <form className='row gy-3 align-items-end mb-24' onSubmit={applyFilters}>
          <div className='col-xl-4 col-md-6'>
            <label className='text-14 text-neutral-500 fw-medium mb-8'><StaticText text={"Payer user ID"} /></label>
            <input
              className='common-input rounded-pill'
              value={filters.payerUserId}
              onChange={(event) => setFilters((current) => ({ ...current, payerUserId: event.target.value }))}
              placeholder='UUID'
            />
          </div>
          <div className='col-xl-3 col-md-6'>
            <label className='text-14 text-neutral-500 fw-medium mb-8'><StaticText text={"Status"} /></label>
            <select
              className='form-select rounded-pill border-neutral-40 text-14 py-11 px-16'
              value={filters.status}
              onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
            >
              <StaticOption value='' text={"All statuses"} />
              {statuses.map((status) => (
                <option value={status} key={status}>{status}</option>
              ))}
            </select>
          </div>
          <div className='col-xl-2 col-md-4'>
            <label className='text-14 text-neutral-500 fw-medium mb-8'><StaticText text={"Plan ID"} /></label>
            <input
              type='number'
              min='1'
              className='common-input rounded-pill'
              value={filters.planId}
              onChange={(event) => setFilters((current) => ({ ...current, planId: event.target.value }))}
              placeholder='Hamısı'
            />
          </div>
          <div className='col-xl-3 col-md-8 d-flex gap-8'>
            <button type='submit' className='btn btn-main rounded-pill flex-grow-1' disabled={isLoading}>
              <StaticText text={"Apply filters"} />
            </button>
            <button
              type='button'
              className='btn btn-outline-secondary rounded-pill flex-grow-1'
              disabled={isLoading}
              onClick={clearFilters}
            >
              <StaticText text={"Clear"} />
            </button>
          </div>
        </form>

        {error ? <div className='alert alert-danger text-14 py-10 mb-16'>{error}</div> : null}
        {notice ? <div className='alert alert-success text-14 py-10 mb-16'>{notice}</div> : null}

        <div className='d-flex align-items-center justify-content-between gap-12 mb-12'>
          <span className='text-13 text-neutral-400'><StaticText text={"Total:"} /> {meta.total}</span>
          <span className='text-13 text-neutral-400'><StaticText text={"Newest first"} /></span>
        </div>

        <div className='table-responsive admin-users-table'>
          <table className='table mb-0'>
            <thead>
              <tr>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'><StaticText text={"Subscription"} /></th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'><StaticText text={"Payer"} /></th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'><StaticText text={"Plan"} /></th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'><StaticText text={"Status"} /></th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'><StaticText text={"Starts"} /></th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'><StaticText text={"Expires"} /></th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'><StaticText text={"Canceled"} /></th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'><StaticText text={"Action"} /></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <AdminTableSkeleton columns={8} />
              ) : subscriptions.length ? (
                subscriptions.map((subscription) => (
                  <tr key={subscription.id}>
                    <td className='py-16 px-20'>
                      <span className='text-12 text-neutral-500 font-monospace text-break'>
                        {subscription.id}
                      </span>
                    </td>
                    <td className='py-16 px-20'>
                      {subscription.payerName ? (
                        <>
                          <strong className='text-14 text-neutral-500 d-block'>{subscription.payerName}</strong>
                          {subscription.payerEmail ? (
                            <span className='text-12 text-neutral-400 text-break'>{subscription.payerEmail}</span>
                          ) : null}
                        </>
                      ) : (
                        <span className='text-12 text-neutral-500 font-monospace text-break'>
                          {subscription.payerUserId || "-"}
                        </span>
                      )}
                    </td>
                    <td className='py-16 px-20'>
                      <strong className='text-14 text-neutral-500 d-block'>
                        {subscription.planCode || subscription.planLabel || "-"}
                      </strong>
                      <span className='text-12 text-neutral-400'><StaticText text={"ID:"} /> {subscription.planId || "-"}</span>
                    </td>
                    <td className='py-16 px-20'>
                      <AdminStatusBadge status={subscription.status} />
                    </td>
                    <td className='py-16 px-20 text-13 text-neutral-500'>{formatDate(subscription.startsAt)}</td>
                    <td className='py-16 px-20 text-13 text-neutral-500'>{formatDate(subscription.expiresAt)}</td>
                    <td className='py-16 px-20 text-13 text-neutral-500'>{formatDate(subscription.canceledAt)}</td>
                    <td className='py-16 px-20'>
                      <button
                        type='button'
                        className='px-14 py-8 border border-neutral-40 rounded-8 text-13 text-neutral-500 bg-white'
                        onClick={() => openEdit(subscription)}
                      >
                        <StaticText text={"Edit"} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <AdminEmptyState columns={8} icon='ph ph-credit-card'><StaticText text={"No subscriptions found."} /></AdminEmptyState>
              )}
            </tbody>
          </table>
        </div>

        <div className='d-flex align-items-center justify-content-end gap-8 mt-24'>
          <button
            type='button'
            className='px-14 py-8 border border-neutral-40 rounded-8 text-14 text-neutral-500'
            disabled={isLoading || meta.page <= 1}
            onClick={() => loadSubscriptions(Math.max(meta.page - 1, 1), appliedFilters)}
          >
            <StaticText text={"Previous"} />
          </button>
          <span className='text-14 text-neutral-400'>
            {meta.page} / {Math.max(meta.totalPages, 1)}
          </span>
          <button
            type='button'
            className='px-14 py-8 border border-neutral-40 rounded-8 text-14 text-neutral-500'
            disabled={isLoading || meta.page >= meta.totalPages}
            onClick={() => loadSubscriptions(Math.min(meta.page + 1, meta.totalPages), appliedFilters)}
          >
            <StaticText text={"Next"} />
          </button>
        </div>
      </div>

      {isGrantOpen ? (
        <div className='modal fade show d-block' tabIndex='-1' role='dialog' style={{ background: "rgba(15, 23, 42, 0.48)" }}>
          <div className='modal-dialog modal-dialog-centered' role='document'>
            <div className='modal-content rounded-12 border-0'>
              <form onSubmit={submitGrant}>
                <div className='modal-header border-neutral-30'>
                  <h5 className='modal-title text-18 fw-semibold text-neutral-500'><StaticText text={"Grant subscription"} /></h5>
                  <button type='button' className='btn-close' aria-label='Bağla' onClick={closeForms}></button>
                </div>
                <div className='modal-body'>
                  <p className='text-13 text-neutral-400 mb-16'>
                    <StaticText text={"A granted subscription becomes active immediately without a payment."} />
                  </p>
                  {formError ? <div className='alert alert-danger text-14 py-10 mb-16'>{formError}</div> : null}
                  <div className='mb-16'>
                    <AdminSearchSelect
                      label='İstifadəçi'
                      value={grantForm.payerUserId}
                      selectedLabel={grantForm.payerLabel}
                      placeholder='Ad və ya e-poçtla axtarın...'
                      loadingText='Yüklənir...'
                      emptyText='Nəticə tapılmadı.'
                      required
                      loadOptions={payerOptions}
                      onChange={(value, label) =>
                        setGrantForm((current) => ({ ...current, payerUserId: value, payerLabel: label }))
                      }
                    />
                  </div>
                  <div className='mb-16'>
                    <label className='text-14 text-neutral-500 fw-medium mb-8' htmlFor='grant-plan'><StaticText text={"Plan"} /></label>
                    <select
                      id='grant-plan'
                      className='form-select rounded-pill border-neutral-40 text-14 py-11 px-16'
                      value={grantForm.planCode}
                      required
                      onChange={(event) => setGrantForm((current) => ({ ...current, planCode: event.target.value }))}
                    >
                      <StaticOption value='' text={"Select a plan"} />
                      {plans.map((plan) => (
                        <option value={plan.code} key={plan.code}>
                          {plan.nameAz} ({plan.code})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className='text-14 text-neutral-500 fw-medium mb-8' htmlFor='grant-expires'><StaticText text={"Expiry (optional)"} /></label>
                    <input
                      id='grant-expires'
                      type='datetime-local'
                      className='common-input rounded-pill'
                      value={grantForm.expiresAt}
                      onChange={(event) => setGrantForm((current) => ({ ...current, expiresAt: event.target.value }))}
                    />
                    <span className='text-12 text-neutral-400 d-block mt-8'>
                      <StaticText text={"Leave empty to use the plan's own period."} />
                    </span>
                  </div>
                </div>
                <div className='modal-footer border-neutral-30'>
                  <button type='button' className='btn btn-outline-secondary rounded-pill' onClick={closeForms} disabled={isSaving}>
                    <StaticText text={"Cancel"} />
                  </button>
                  <button type='submit' className='btn btn-main rounded-pill' disabled={isSaving}>
                    <StaticText text={"Grant subscription"} />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}

      {editing ? (
        <div className='modal fade show d-block' tabIndex='-1' role='dialog' style={{ background: "rgba(15, 23, 42, 0.48)" }}>
          <div className='modal-dialog modal-dialog-centered' role='document'>
            <div className='modal-content rounded-12 border-0'>
              <form onSubmit={submitEdit}>
                <div className='modal-header border-neutral-30'>
                  <h5 className='modal-title text-18 fw-semibold text-neutral-500'><StaticText text={"Edit subscription"} /></h5>
                  <button type='button' className='btn-close' aria-label='Bağla' onClick={closeForms}></button>
                </div>
                <div className='modal-body'>
                  <p className='text-13 text-neutral-400 mb-16'>
                    {/* data-i18n-managed: the payer name is user data resolved at runtime; without this the
                        i18n observer would revert the node to its first-seen text. See §6b. */}
                    <span data-i18n-managed='true'>{editing.payerLabel}</span>
                  </p>
                  {formError ? <div className='alert alert-danger text-14 py-10 mb-16'>{formError}</div> : null}
                  <div className='mb-16'>
                    <label className='text-14 text-neutral-500 fw-medium mb-8' htmlFor='edit-plan'><StaticText text={"Plan"} /></label>
                    <select
                      id='edit-plan'
                      className='form-select rounded-pill border-neutral-40 text-14 py-11 px-16'
                      value={editing.planCode}
                      onChange={(event) => setEditing((current) => ({ ...current, planCode: event.target.value }))}
                    >
                      {plans.some((plan) => plan.code === editing.planCode) ? null : (
                        <option value={editing.planCode}>{editing.planCode}</option>
                      )}
                      {plans.map((plan) => (
                        <option value={plan.code} key={plan.code}>
                          {plan.nameAz} ({plan.code})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className='mb-16'>
                    <label className='text-14 text-neutral-500 fw-medium mb-8' htmlFor='edit-status'><StaticText text={"Status"} /></label>
                    <select
                      id='edit-status'
                      className='form-select rounded-pill border-neutral-40 text-14 py-11 px-16'
                      value={editing.status}
                      onChange={(event) => setEditing((current) => ({ ...current, status: event.target.value }))}
                    >
                      {statuses.map((status) => (
                        <option value={status} key={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className='text-14 text-neutral-500 fw-medium mb-8' htmlFor='edit-expires'><StaticText text={"Expiry"} /></label>
                    <input
                      id='edit-expires'
                      type='datetime-local'
                      className='common-input rounded-pill'
                      value={editing.expiresAt}
                      onChange={(event) => setEditing((current) => ({ ...current, expiresAt: event.target.value }))}
                    />
                    <span className='text-12 text-neutral-400 d-block mt-8'>
                      <StaticText text={"Only the fields you change are submitted."} />
                    </span>
                  </div>
                </div>
                <div className='modal-footer border-neutral-30'>
                  <button type='button' className='btn btn-outline-secondary rounded-pill' onClick={closeForms} disabled={isSaving}>
                    <StaticText text={"Cancel"} />
                  </button>
                  <button type='submit' className='btn btn-main rounded-pill' disabled={isSaving}>
                    <StaticText text={"Save changes"} />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AdminSubscriptionsPage;
