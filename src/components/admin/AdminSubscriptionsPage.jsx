"use client";

import { useEffect, useState } from "react";
import AdminRefreshButton from "@/components/admin/AdminRefreshButton";
import AdminStatusBadge from "@/components/admin/AdminStatusBadge";
import { fetchAdminSubscriptions } from "@/lib/api";
import StaticText from "@/components/StaticText";
import StaticOption from "@/components/StaticOption";



const PAGE_SIZE = 10;
const defaultMeta = { page: 1, perPage: PAGE_SIZE, total: 0, totalPages: 1 };
const emptyFilters = { payerUserId: "", status: "", planId: "" };
const statuses = ["PENDING", "ACTIVE", "EXPIRED", "CANCELED"];

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("az-AZ", { dateStyle: "medium", timeStyle: "short" }).format(date);
};

const AdminSubscriptionsPage = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [meta, setMeta] = useState(defaultMeta);
  const [filters, setFilters] = useState(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

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
      setError(requestError?.message || "Subscriptions could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSubscriptions(1, emptyFilters);
  }, []);

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
          <AdminRefreshButton
            isLoading={isLoading}
            onClick={() => loadSubscriptions(meta.page, appliedFilters)}
          />
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
              placeholder='All'
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
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td className='py-20 px-20 text-neutral-400' colSpan='7'><StaticText text={"Loading subscriptions..."} /></td>
                </tr>
              ) : subscriptions.length ? (
                subscriptions.map((subscription) => (
                  <tr key={subscription.id}>
                    <td className='py-16 px-20'>
                      <span className='text-12 text-neutral-500 font-monospace text-break'>
                        {subscription.id}
                      </span>
                    </td>
                    <td className='py-16 px-20'>
                      <span className='text-12 text-neutral-500 font-monospace text-break'>
                        {subscription.payerUserId || "-"}
                      </span>
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
                  </tr>
                ))
              ) : (
                <tr>
                  <td className='py-24 px-20 text-neutral-400' colSpan='7'><StaticText text={"No subscriptions found."} /></td>
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
    </div>
  );
};

export default AdminSubscriptionsPage;
