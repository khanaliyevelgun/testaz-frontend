"use client";

import { useEffect, useState } from "react";
import AdminRefreshButton from "@/components/admin/AdminRefreshButton";
import AdminStatusBadge from "@/components/admin/AdminStatusBadge";
import {
  cancelSubscription,
  fetchMySubscriptions,
  fetchSubscriptionEntitlement,
  fetchSubscriptionPlans,
  startPaymentCheckout,
} from "@/lib/api";

const formatDate = (value) => (value ? new Date(value).toLocaleString("az-AZ") : "-");

const formatPrice = (amount, currency = "AZN") =>
  `${Number(amount || 0).toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1")} ${currency}`;

const AdminPaymentsPage = () => {
  const [plans, setPlans] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [entitlement, setEntitlement] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [checkoutCode, setCheckoutCode] = useState("");
  const [cancelingId, setCancelingId] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const loadPayments = async () => {
    setIsLoading(true);
    setError("");

    try {
      const [planResponse, subscriptionResponse, entitlementResponse] = await Promise.all([
        fetchSubscriptionPlans(),
        fetchMySubscriptions(),
        fetchSubscriptionEntitlement(),
      ]);
      setPlans(planResponse || []);
      setSubscriptions(subscriptionResponse || []);
      setEntitlement(entitlementResponse || null);
    } catch (requestError) {
      setError(requestError?.message || "Subscription information could not be loaded.");
      setPlans([]);
      setSubscriptions([]);
      setEntitlement(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const handleCheckout = async (planCode) => {
    setCheckoutCode(planCode);
    setError("");
    setNotice("");

    try {
      const checkout = await startPaymentCheckout(planCode);
      if (checkout?.redirectUrl) {
        window.location.assign(checkout.redirectUrl);
        return;
      }

      await loadPayments();
    } catch (requestError) {
      setError(requestError?.message || "Checkout could not be started.");
    } finally {
      setCheckoutCode("");
    }
  };

  const handleCancel = async (subscription) => {
    if (!window.confirm("Cancel this subscription? Access will end immediately.")) return;

    setCancelingId(subscription.id);
    setError("");
    setNotice("");

    try {
      await cancelSubscription(subscription.id);
      setNotice("Subscription canceled.");
      await loadPayments();
    } catch (requestError) {
      setError(requestError?.message || "Subscription could not be canceled.");
    } finally {
      setCancelingId("");
    }
  };

  return (
    <div className='px-24 py-24'>
      <div className='bg-white rounded-10 px-24 py-24 mb-24'>
        <div className='d-flex flex-wrap align-items-center justify-content-between gap-16 mb-24'>
          <div>
            <h4 className='fw-semibold text-neutral-500 text-20 mb-4'>Subscriptions</h4>
            <p className='text-14 text-neutral-400 mb-0'>
              Entitlement: {entitlement?.entitled ? "Active" : "Inactive"}
            </p>
          </div>
          <AdminRefreshButton isLoading={isLoading} onClick={loadPayments} />
        </div>

        {notice ? <div className='alert alert-success text-14 py-10 mb-16'>{notice}</div> : null}
        {error ? <div className='alert alert-danger text-14 py-10 mb-16'>{error}</div> : null}
      </div>

      <div className='row gy-4 mb-24'>
        {isLoading ? (
          <div className='col-12'>
            <div className='bg-white rounded-10 px-24 py-24 text-neutral-400'>Loading plans...</div>
          </div>
        ) : plans.length ? (
          plans.map((plan) => (
            <div className='col-xl-4 col-md-6' key={plan.id || plan.code}>
              <div className='bg-white rounded-10 px-24 py-24 h-100 d-flex flex-column border border-neutral-30'>
                <div className='d-flex align-items-start justify-content-between gap-12 mb-16'>
                  <div>
                    <span className='text-12 fw-semibold text-main-600'>{plan.code}</span>
                    <h5 className='text-20 fw-semibold text-neutral-500 mb-0 mt-4'>
                      {plan.nameAz || plan.name || plan.code}
                    </h5>
                  </div>
                  {plan.coversLinkedChildren ? <AdminStatusBadge status='ACTIVE' label='Family' /> : null}
                </div>
                <div className='display-6 fw-bold text-neutral-700 mb-4'>{formatPrice(plan.priceAmount, plan.currency)}</div>
                <p className='text-14 text-neutral-400 mb-24'>{plan.periodDays || "-"} days</p>
                <ul className='d-flex flex-column gap-10 mb-24 flex-grow-1'>
                  <li className='d-flex align-items-center gap-8 text-14 text-neutral-500'>
                    <i className='ph-bold ph-check text-success-600' />
                    Tests and result analytics
                  </li>
                  <li className='d-flex align-items-center gap-8 text-14 text-neutral-500'>
                    <i className={`${plan.coversLinkedChildren ? "ph-bold ph-check text-success-600" : "ph-bold ph-x text-danger-600"}`} />
                    Linked children coverage
                  </li>
                </ul>
                {Number(plan.priceAmount || 0) > 0 ? (
                  <button
                    type='button'
                    className='btn btn-main rounded-pill w-100 d-flex align-items-center justify-content-center gap-8'
                    disabled={checkoutCode === plan.code}
                    onClick={() => handleCheckout(plan.code)}
                  >
                    {checkoutCode === plan.code ? "Starting..." : "Checkout"}
                    <i className='ph-bold ph-arrow-up-right d-flex text-lg' />
                  </button>
                ) : (
                  <span className='btn btn-outline-main rounded-pill w-100 disabled'>Free plan</span>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className='col-12'>
            <div className='bg-white rounded-10 px-24 py-24 text-neutral-400'>No active plans found.</div>
          </div>
        )}
      </div>

      <div className='bg-white rounded-10 px-24 py-24'>
        <h4 className='fw-semibold text-neutral-500 text-20 mb-24'>Subscription History</h4>
        <div className='table-responsive admin-users-table'>
          <table className='table mb-0'>
            <thead>
              <tr>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Plan</th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Status</th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Starts</th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Expires</th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Canceled</th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20 text-end'>Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td className='py-20 px-20 text-neutral-400' colSpan='6'>Loading...</td></tr>
              ) : subscriptions.length ? (
                subscriptions.map((subscription) => (
                  <tr key={subscription.id}>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{subscription.planLabel}</td>
                    <td className='py-16 px-20'><AdminStatusBadge status={subscription.status} /></td>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{formatDate(subscription.startsAt)}</td>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{formatDate(subscription.expiresAt)}</td>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{formatDate(subscription.canceledAt)}</td>
                    <td className='py-16 px-20 text-end'>
                      {["PENDING", "ACTIVE"].includes(subscription.status) ? (
                        <button
                          type='button'
                          className='px-14 py-8 border border-danger-200 rounded-pill text-13 text-danger-600 bg-white'
                          disabled={cancelingId === subscription.id}
                          onClick={() => handleCancel(subscription)}
                        >
                          {cancelingId === subscription.id ? "Canceling..." : "Cancel"}
                        </button>
                      ) : (
                        <span className='text-13 text-neutral-300'>-</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td className='py-20 px-20 text-neutral-400' colSpan='6'>No subscriptions found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminPaymentsPage;
