"use client";

import { useEffect, useState } from "react";
import AdminRefreshButton from "@/components/admin/AdminRefreshButton";
import AdminStatusBadge from "@/components/admin/AdminStatusBadge";
import { fetchAdminPayments } from "@/lib/api";
import { formatDateTime as formatDate } from "@/lib/format";
import StaticText from "@/components/StaticText";
import StaticOption from "@/components/StaticOption";



const PAGE_SIZE = 10;
const defaultMeta = { page: 1, perPage: PAGE_SIZE, total: 0, totalPages: 1 };
const emptyFilters = { payerUserId: "", status: "", provider: "" };
const statuses = ["PENDING", "COMPLETED", "FAILED"];

const formatPrice = (amount, currency = "AZN") =>
  `${Number(amount || 0).toFixed(2)} ${currency || "AZN"}`;

const AdminPaymentTransactionsPage = () => {
  const [payments, setPayments] = useState([]);
  const [meta, setMeta] = useState(defaultMeta);
  const [filters, setFilters] = useState(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPayments = async (page = 1, query = appliedFilters) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetchAdminPayments({
        page,
        perPage: PAGE_SIZE,
        payerUserId: query.payerUserId,
        status: query.status,
        provider: query.provider,
      });
      setPayments(response?.data || []);
      setMeta(response?.meta || { ...defaultMeta, page });
    } catch (requestError) {
      setPayments([]);
      setMeta({ ...defaultMeta, page });
      setError(requestError?.message || "Payment transactions could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPayments(1, emptyFilters);
  }, []);

  const applyFilters = (event) => {
    event.preventDefault();
    const nextFilters = {
      ...filters,
      payerUserId: filters.payerUserId.trim(),
      provider: filters.provider.trim(),
    };
    setAppliedFilters(nextFilters);
    loadPayments(1, nextFilters);
  };

  const clearFilters = () => {
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    loadPayments(1, emptyFilters);
  };

  return (
    <div className='px-24 py-24'>
      <div className='bg-white rounded-10 px-24 py-24'>
        <div className='d-flex flex-wrap align-items-center justify-content-between gap-16 mb-24'>
          <div>
            <h4 className='fw-semibold text-neutral-500 text-20 mb-4'><StaticText text={"Payment transactions"} /></h4>
            <p className='text-14 text-neutral-400 mb-0'>
              <StaticText text={"Provider payment attempts, completion details and failure reasons."} />
            </p>
          </div>
          <AdminRefreshButton
            isLoading={isLoading}
            onClick={() => loadPayments(meta.page, appliedFilters)}
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
            <label className='text-14 text-neutral-500 fw-medium mb-8'><StaticText text={"Provider"} /></label>
            <input
              className='common-input rounded-pill'
              value={filters.provider}
              onChange={(event) => setFilters((current) => ({ ...current, provider: event.target.value }))}
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
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'><StaticText text={"Payment"} /></th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'><StaticText text={"Payer"} /></th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'><StaticText text={"Provider"} /></th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'><StaticText text={"Amount"} /></th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'><StaticText text={"Status"} /></th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'><StaticText text={"Failure"} /></th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'><StaticText text={"Created"} /></th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'><StaticText text={"Completed"} /></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td className='py-20 px-20 text-neutral-400' colSpan='8'><StaticText text={"Loading payments..."} /></td>
                </tr>
              ) : payments.length ? (
                payments.map((payment) => (
                  <tr key={payment.id}>
                    <td className='py-16 px-20'>
                      <span className='text-12 text-neutral-500 font-monospace text-break d-block'>
                        {payment.id}
                      </span>
                      <span className='text-12 text-neutral-400'>
                        <StaticText text={"Subscription:"} /> {payment.subscriptionId || "-"}
                      </span>
                    </td>
                    <td className='py-16 px-20'>
                      <span className='text-12 text-neutral-500 font-monospace text-break'>
                        {payment.payerUserId || "-"}
                      </span>
                    </td>
                    <td className='py-16 px-20'>
                      <strong className='text-14 text-neutral-500 d-block'>{payment.provider || "-"}</strong>
                      <span className='text-12 text-neutral-400 text-break'>{payment.providerRef || "-"}</span>
                    </td>
                    <td className='py-16 px-20 text-14 fw-medium text-neutral-500'>
                      {formatPrice(payment.amount, payment.currency)}
                    </td>
                    <td className='py-16 px-20'>
                      <AdminStatusBadge status={payment.status} />
                    </td>
                    <td className='py-16 px-20 text-13 text-danger-600'>
                      {payment.failureReason || "-"}
                    </td>
                    <td className='py-16 px-20 text-13 text-neutral-500'>{formatDate(payment.createdAt)}</td>
                    <td className='py-16 px-20 text-13 text-neutral-500'>{formatDate(payment.completedAt)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className='py-24 px-20 text-neutral-400' colSpan='8'><StaticText text={"No payment transactions found."} /></td>
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
            onClick={() => loadPayments(Math.max(meta.page - 1, 1), appliedFilters)}
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
            onClick={() => loadPayments(Math.min(meta.page + 1, meta.totalPages), appliedFilters)}
          >
            <StaticText text={"Next"} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPaymentTransactionsPage;
