"use client";

import { useCallback, useEffect, useState } from "react";
import AdminRefreshButton from "@/components/admin/AdminRefreshButton";
import AdminStatusBadge from "@/components/admin/AdminStatusBadge";
import {
  activateAdminPlan,
  createAdminPlan,
  deactivateAdminPlan,
  fetchAdminPlan,
  fetchAdminPlans,
  updateAdminPlan,
} from "@/lib/api";

const PAGE_SIZE = 10;
const defaultMeta = { page: 1, perPage: PAGE_SIZE, total: 0, totalPages: 1 };
const emptyForm = {
  code: "",
  nameAz: "",
  priceAmount: "",
  currency: "AZN",
  periodDays: "30",
  coversLinkedChildren: false,
};

const formatPrice = (amount, currency = "AZN") =>
  new Intl.NumberFormat("az-AZ", {
    style: "currency",
    currency: currency || "AZN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("az-AZ", { dateStyle: "medium", timeStyle: "short" }).format(date);
};

const AdminSubscriptionPlansPage = () => {
  const [plans, setPlans] = useState([]);
  const [meta, setMeta] = useState(defaultMeta);
  const [isLoading, setIsLoading] = useState(true);
  const [actionId, setActionId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [filters, setFilters] = useState({ code: "", active: "" });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const loadPlans = useCallback(
    async (page = 1) => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetchAdminPlans({
          page,
          perPage: PAGE_SIZE,
          code: filters.code,
          active: filters.active,
        });
        setPlans(response?.data || []);
        setMeta(response?.meta || { ...defaultMeta, page });
      } catch (requestError) {
        setPlans([]);
        setMeta({ ...defaultMeta, page });
        setError(requestError?.message || "Subscription plans could not be loaded.");
      } finally {
        setIsLoading(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setFilters((current) => ({ ...current, code: searchInput.trim() }));
    }, 350);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    loadPlans(1);
  }, [loadPlans]);

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const openCreateForm = () => {
    setError("");
    setNotice("");
    setEditingId(null);
    setForm(emptyForm);
    setIsFormOpen(true);
  };

  const openEditForm = async (plan) => {
    setActionId(`edit-${plan.id}`);
    setError("");
    setNotice("");

    try {
      const detail = await fetchAdminPlan(plan.id);
      setEditingId(detail.id);
      setForm({
        code: detail.code || "",
        nameAz: detail.nameAz || detail.name || "",
        priceAmount: String(detail.priceAmount ?? ""),
        currency: detail.currency || "AZN",
        periodDays: String(detail.periodDays ?? ""),
        coversLinkedChildren: Boolean(detail.coversLinkedChildren),
      });
      setIsFormOpen(true);
    } catch (requestError) {
      setError(requestError?.message || "Plan details could not be loaded.");
    } finally {
      setActionId("");
    }
  };

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");

    const payload = {
      nameAz: form.nameAz.trim(),
      priceAmount: Number(form.priceAmount),
      currency: form.currency.trim().toUpperCase(),
      periodDays: Number(form.periodDays),
      coversLinkedChildren: Boolean(form.coversLinkedChildren),
    };

    if (!payload.nameAz || !Number.isFinite(payload.priceAmount) || payload.priceAmount < 0) {
      setError("Enter a valid name and non-negative price.");
      return;
    }

    if (!Number.isInteger(payload.periodDays) || payload.periodDays < 1 || payload.periodDays > 3660) {
      setError("Period must be between 1 and 3660 days.");
      return;
    }

    if (payload.currency.length !== 3) {
      setError("Currency must be a three-letter code.");
      return;
    }

    setIsSaving(true);

    try {
      if (editingId != null) {
        await updateAdminPlan(editingId, payload);
        setNotice("Subscription plan updated.");
      } else {
        const code = form.code.trim().toUpperCase();
        if (!/^[A-Z0-9_]+$/.test(code)) {
          setError("Code may contain only letters, numbers and underscores.");
          return;
        }
        await createAdminPlan({ ...payload, code });
        setNotice("Subscription plan created.");
      }

      closeForm();
      await loadPlans(editingId != null ? meta.page : 1);
    } catch (requestError) {
      setError(requestError?.message || "Subscription plan could not be saved.");
    } finally {
      setIsSaving(false);
    }
  };

  const togglePlan = async (plan) => {
    if (plan.active && !window.confirm(`Deactivate ${plan.code}? It will disappear from the public plan list.`)) {
      return;
    }

    setActionId(`toggle-${plan.id}`);
    setError("");
    setNotice("");

    try {
      if (plan.active) {
        await deactivateAdminPlan(plan.id);
        setNotice("Subscription plan deactivated.");
      } else {
        await activateAdminPlan(plan.id);
        setNotice("Subscription plan activated.");
      }
      await loadPlans(meta.page);
    } catch (requestError) {
      setError(requestError?.message || "Plan status could not be changed.");
    } finally {
      setActionId("");
    }
  };

  return (
    <div className='px-24 py-24'>
      <div className='bg-white rounded-10 px-24 py-24'>
        <div className='d-flex flex-wrap align-items-center justify-content-between gap-16 mb-24'>
          <div>
            <h4 className='fw-semibold text-neutral-500 text-20 mb-4'>Subscription plans</h4>
            <p className='text-14 text-neutral-400 mb-0'>Create, edit and publish the plans shown at checkout.</p>
          </div>
          <div className='d-flex flex-wrap align-items-center gap-8'>
            <button type='button' className='btn btn-main rounded-pill px-20' onClick={openCreateForm}>
              Create plan
            </button>
            <AdminRefreshButton isLoading={isLoading} onClick={() => loadPlans(meta.page)} />
          </div>
        </div>

        {notice ? <div className='alert alert-success text-14 py-10 mb-16'>{notice}</div> : null}
        {error ? <div className='alert alert-danger text-14 py-10 mb-16'>{error}</div> : null}

        {isFormOpen ? (
          <form className='border border-neutral-30 rounded-10 p-20 mb-24' onSubmit={handleSubmit}>
            <div className='d-flex align-items-center justify-content-between gap-12 mb-20'>
              <h5 className='text-16 fw-semibold text-neutral-500 mb-0'>
                {editingId != null ? "Edit plan" : "Create plan"}
              </h5>
              <button type='button' className='btn-close' aria-label='Close form' onClick={closeForm} />
            </div>
            <div className='row gy-3'>
              <div className='col-lg-4 col-md-6'>
                <label className='text-14 text-neutral-500 fw-medium mb-8'>Code</label>
                <input
                  className='common-input rounded-pill text-uppercase'
                  value={form.code}
                  maxLength='40'
                  disabled={editingId != null}
                  required
                  onChange={(event) => updateForm("code", event.target.value)}
                  placeholder='MONTHLY'
                />
              </div>
              <div className='col-lg-4 col-md-6'>
                <label className='text-14 text-neutral-500 fw-medium mb-8'>Name</label>
                <input
                  className='common-input rounded-pill'
                  value={form.nameAz}
                  maxLength='80'
                  required
                  onChange={(event) => updateForm("nameAz", event.target.value)}
                  placeholder='Monthly plan'
                />
              </div>
              <div className='col-lg-2 col-md-6'>
                <label className='text-14 text-neutral-500 fw-medium mb-8'>Price</label>
                <input
                  type='number'
                  min='0'
                  step='0.01'
                  className='common-input rounded-pill'
                  value={form.priceAmount}
                  required
                  onChange={(event) => updateForm("priceAmount", event.target.value)}
                />
              </div>
              <div className='col-lg-2 col-md-6'>
                <label className='text-14 text-neutral-500 fw-medium mb-8'>Currency</label>
                <input
                  className='common-input rounded-pill text-uppercase'
                  value={form.currency}
                  minLength='3'
                  maxLength='3'
                  required
                  onChange={(event) => updateForm("currency", event.target.value)}
                />
              </div>
              <div className='col-lg-3 col-md-6'>
                <label className='text-14 text-neutral-500 fw-medium mb-8'>Period (days)</label>
                <input
                  type='number'
                  min='1'
                  max='3660'
                  className='common-input rounded-pill'
                  value={form.periodDays}
                  required
                  onChange={(event) => updateForm("periodDays", event.target.value)}
                />
              </div>
              <div className='col-lg-5 col-md-6 d-flex align-items-end'>
                <label className='d-flex align-items-center gap-10 py-12 text-14 text-neutral-500'>
                  <input
                    type='checkbox'
                    className='form-check-input mt-0'
                    checked={form.coversLinkedChildren}
                    onChange={(event) => updateForm("coversLinkedChildren", event.target.checked)}
                  />
                  Covers linked children
                </label>
              </div>
              <div className='col-lg-4 d-flex align-items-end justify-content-lg-end gap-8'>
                <button type='button' className='btn btn-outline-secondary rounded-pill px-20' onClick={closeForm}>
                  Cancel
                </button>
                <button type='submit' className='btn btn-main rounded-pill px-20' disabled={isSaving}>
                  {isSaving ? "Saving..." : editingId != null ? "Save changes" : "Create plan"}
                </button>
              </div>
            </div>
          </form>
        ) : null}

        <div className='d-flex flex-wrap align-items-center gap-12 mb-24'>
          <div className='position-relative flex-grow-1 min-w-240-px'>
            <input
              type='search'
              className='common-input rounded-pill ps-16 pe-44'
              placeholder='Search plan code...'
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
            <span className='position-absolute top-50 translate-middle-y inset-inline-end-0 me-16 text-neutral-400'>
              <i className='ph ph-magnifying-glass' />
            </span>
          </div>
          <select
            className='form-select rounded-pill border-neutral-40 text-14 py-11 px-16 w-auto min-w-180-px'
            value={filters.active}
            onChange={(event) => setFilters((current) => ({ ...current, active: event.target.value }))}
          >
            <option value=''>All statuses</option>
            <option value='true'>Active</option>
            <option value='false'>Inactive</option>
          </select>
        </div>

        <div className='table-responsive admin-users-table'>
          <table className='table mb-0'>
            <thead>
              <tr>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Plan</th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Price</th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Period</th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Coverage</th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Status</th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Updated</th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20 text-end'>Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td className='py-20 px-20 text-neutral-400' colSpan='7'>Loading plans...</td>
                </tr>
              ) : plans.length ? (
                plans.map((plan) => (
                  <tr key={plan.id}>
                    <td className='py-16 px-20'>
                      <strong className='text-14 text-neutral-500 d-block'>{plan.nameAz || plan.name}</strong>
                      <span className='text-12 text-neutral-400'>{plan.code}</span>
                    </td>
                    <td className='py-16 px-20 text-14 text-neutral-500'>
                      {formatPrice(plan.priceAmount, plan.currency)}
                    </td>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{plan.periodDays} days</td>
                    <td className='py-16 px-20 text-14 text-neutral-500'>
                      {plan.coversLinkedChildren ? "Family" : "Account only"}
                    </td>
                    <td className='py-16 px-20'>
                      <AdminStatusBadge status={plan.active ? "ACTIVE" : "INACTIVE"} />
                    </td>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{formatDate(plan.updatedAt)}</td>
                    <td className='py-16 px-20'>
                      <div className='d-flex justify-content-end gap-8'>
                        <button
                          type='button'
                          className='px-14 py-8 border border-neutral-40 rounded-pill text-13 text-neutral-500 bg-white'
                          disabled={Boolean(actionId)}
                          onClick={() => openEditForm(plan)}
                        >
                          {actionId === `edit-${plan.id}` ? "Loading..." : "Edit"}
                        </button>
                        <button
                          type='button'
                          className={`px-14 py-8 border rounded-pill text-13 bg-white ${
                            plan.active
                              ? "border-danger-200 text-danger-600"
                              : "border-success-200 text-success-600"
                          }`}
                          disabled={Boolean(actionId)}
                          onClick={() => togglePlan(plan)}
                        >
                          {actionId === `toggle-${plan.id}`
                            ? "Updating..."
                            : plan.active
                              ? "Deactivate"
                              : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className='py-24 px-20 text-neutral-400' colSpan='7'>No subscription plans found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className='d-flex align-items-center justify-content-end gap-8 mt-24'>
          <button
            type='button'
            className='px-14 py-8 border border-neutral-40 rounded-8 text-14 text-neutral-500'
            disabled={isLoading || meta.page <= 1}
            onClick={() => loadPlans(Math.max(meta.page - 1, 1))}
          >
            Previous
          </button>
          <span className='text-14 text-neutral-400'>
            {meta.page} / {Math.max(meta.totalPages, 1)}
          </span>
          <button
            type='button'
            className='px-14 py-8 border border-neutral-40 rounded-8 text-14 text-neutral-500'
            disabled={isLoading || meta.page >= meta.totalPages}
            onClick={() => loadPlans(Math.min(meta.page + 1, meta.totalPages))}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminSubscriptionPlansPage;
