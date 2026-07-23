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
import { formatDateTime as formatDate } from "@/lib/format";
import StaticText from "@/components/StaticText";
import AdminTableSkeleton from "@/components/admin/AdminTableSkeleton";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import StaticOption from "@/components/StaticOption";



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
        setError(requestError?.message || "Abunəlik planları yüklənmədi.");
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
      setError(requestError?.message || "Planın təfərrüatı yüklənmədi.");
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
      setError("Düzgün ad və mənfi olmayan qiymət daxil edin.");
      return;
    }

    if (!Number.isInteger(payload.periodDays) || payload.periodDays < 1 || payload.periodDays > 3660) {
      setError("Müddət 1 ilə 3660 gün arasında olmalıdır.");
      return;
    }

    if (payload.currency.length !== 3) {
      setError("Valyuta üç hərfli kod olmalıdır.");
      return;
    }

    setIsSaving(true);

    try {
      if (editingId != null) {
        await updateAdminPlan(editingId, payload);
        setNotice("Abunəlik planı yeniləndi.");
      } else {
        const code = form.code.trim().toUpperCase();
        if (!/^[A-Z0-9_]+$/.test(code)) {
          setError("Kod yalnız hərf, rəqəm və alt xəttdən ibarət ola bilər.");
          return;
        }
        await createAdminPlan({ ...payload, code });
        setNotice("Abunəlik planı yaradıldı.");
      }

      closeForm();
      await loadPlans(editingId != null ? meta.page : 1);
    } catch (requestError) {
      setError(requestError?.message || "Abunəlik planı yadda saxlanılmadı.");
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
        setNotice("Abunəlik planı deaktiv edildi.");
      } else {
        await activateAdminPlan(plan.id);
        setNotice("Abunəlik planı aktivləşdirildi.");
      }
      await loadPlans(meta.page);
    } catch (requestError) {
      setError(requestError?.message || "Planın statusu dəyişdirilmədi.");
    } finally {
      setActionId("");
    }
  };

  return (
    <div className='px-24 py-24'>
      <div className='bg-white rounded-10 px-24 py-24'>
        <div className='d-flex flex-wrap align-items-center justify-content-between gap-16 mb-24'>
          <div>
            <h4 className='fw-semibold text-neutral-500 text-20 mb-4'><StaticText text={"Subscription plans"} /></h4>
            <p className='text-14 text-neutral-400 mb-0'><StaticText text={"Create, edit and publish the plans shown at checkout."} /></p>
          </div>
          <div className='d-flex flex-wrap align-items-center gap-8'>
            <button type='button' className='btn btn-main rounded-pill px-20' onClick={openCreateForm}>
              <StaticText text={"Create plan"} />
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
                {editingId != null ? <StaticText text={"Edit plan"} /> : <StaticText text={"Create plan"} />}
              </h5>
              <button type='button' className='btn-close' aria-label='Close form' onClick={closeForm} />
            </div>
            <div className='row gy-3'>
              <div className='col-lg-4 col-md-6'>
                <label className='text-14 text-neutral-500 fw-medium mb-8'><StaticText text={"Code"} /></label>
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
                <label className='text-14 text-neutral-500 fw-medium mb-8'><StaticText text={"Name"} /></label>
                <input
                  className='common-input rounded-pill'
                  value={form.nameAz}
                  maxLength='80'
                  required
                  onChange={(event) => updateForm("nameAz", event.target.value)}
                  placeholder='Aylıq plan'
                />
              </div>
              <div className='col-lg-2 col-md-6'>
                <label className='text-14 text-neutral-500 fw-medium mb-8'><StaticText text={"Price"} /></label>
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
                <label className='text-14 text-neutral-500 fw-medium mb-8'><StaticText text={"Currency"} /></label>
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
                <label className='text-14 text-neutral-500 fw-medium mb-8'><StaticText text={"Period (days)"} /></label>
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
                  <StaticText text={"Covers linked children"} />
                </label>
              </div>
              <div className='col-lg-4 d-flex align-items-end justify-content-lg-end gap-8'>
                <button type='button' className='btn btn-outline-secondary rounded-pill px-20' onClick={closeForm}>
                  <StaticText text={"Cancel"} />
                </button>
                <button type='submit' className='btn btn-main rounded-pill px-20' disabled={isSaving}>
                  {isSaving ? <StaticText text={"Saving..."} /> : editingId != null ? <StaticText text={"Save changes"} /> : <StaticText text={"Create plan"} />}
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
              aria-label='Plan kodu üzrə axtar'
              placeholder='Plan kodu üzrə axtar...'
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
            <span className='position-absolute top-50 translate-middle-y inset-inline-end-0 me-16 text-neutral-400'>
              <i className='ph ph-magnifying-glass' aria-hidden='true' />
            </span>
          </div>
          <select
            className='form-select rounded-pill border-neutral-40 text-14 py-11 px-16 w-auto min-w-180-px'
            value={filters.active}
            onChange={(event) => setFilters((current) => ({ ...current, active: event.target.value }))}
          >
            <StaticOption value='' text={"All statuses"} />
            <StaticOption value='true' text={"Active"} />
            <StaticOption value='false' text={"Inactive"} />
          </select>
        </div>

        <div className='table-responsive admin-users-table'>
          <table className='table mb-0'>
            <thead>
              <tr>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'><StaticText text={"Plan"} /></th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'><StaticText text={"Price"} /></th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'><StaticText text={"Period"} /></th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'><StaticText text={"Coverage"} /></th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'><StaticText text={"Status"} /></th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'><StaticText text={"Updated"} /></th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20 text-end'><StaticText text={"Action"} /></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <AdminTableSkeleton columns={7} />
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
                    <td className='py-16 px-20 text-14 text-neutral-500'>{plan.periodDays} <StaticText text={"days"} /></td>
                    <td className='py-16 px-20 text-14 text-neutral-500'>
                      {plan.coversLinkedChildren ? <StaticText text={"Family"} /> : <StaticText text={"Account only"} />}
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
                          {actionId === `edit-${plan.id}` ? <StaticText text={"Loading..."} /> : <StaticText text={"Edit"} />}
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
                            ? <StaticText text={"Updating..."} />
                            : plan.active
                              ? <StaticText text={"Deactivate"} />
                              : <StaticText text={"Activate"} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <AdminEmptyState columns={7} icon='ph ph-credit-card'><StaticText text={"No subscription plans found."} /></AdminEmptyState>
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
            <StaticText text={"Previous"} />
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
            <StaticText text={"Next"} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminSubscriptionPlansPage;
