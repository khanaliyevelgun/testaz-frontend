"use client";

import { useEffect, useState } from "react";
import AdminRefreshButton from "@/components/admin/AdminRefreshButton";
import AdminStatusBadge from "@/components/admin/AdminStatusBadge";
import { fetchMySubscriptions, fetchSubscriptionEntitlement } from "@/lib/api";

const AdminPaymentsPage = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [entitlement, setEntitlement] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPayments = async () => {
    setIsLoading(true);
    setError("");

    try {
      const [subscriptionResponse, entitlementResponse] = await Promise.all([
        fetchMySubscriptions(),
        fetchSubscriptionEntitlement(),
      ]);
      setSubscriptions(subscriptionResponse || []);
      setEntitlement(entitlementResponse || null);
    } catch {
      setError("Payment information could not be loaded.");
      setSubscriptions([]);
      setEntitlement(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  return (
    <div className='px-24 py-24'>
      <div className='bg-white rounded-10 px-24 py-24'>
        <div className='d-flex flex-wrap align-items-center justify-content-between gap-16 mb-24'>
          <div>
            <h4 className='fw-semibold text-neutral-500 text-20 mb-4'>Payments</h4>
            <p className='text-14 text-neutral-400 mb-0'>
              Entitlement: {entitlement?.entitled ? "Active" : "Inactive"}
            </p>
          </div>
          <AdminRefreshButton isLoading={isLoading} onClick={loadPayments} />
        </div>

        {error ? <p className='text-danger mb-16'>{error}</p> : null}

        <div className='table-responsive admin-users-table'>
          <table className='table mb-0'>
            <thead>
              <tr>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Plan</th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Status</th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Starts</th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Expires</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td className='py-20 px-20 text-neutral-400' colSpan='4'>Loading...</td></tr>
              ) : subscriptions.length ? (
                subscriptions.map((subscription) => (
                  <tr key={subscription.id}>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{subscription.planCode || subscription.planId}</td>
                    <td className='py-16 px-20'><AdminStatusBadge status={subscription.status} /></td>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{subscription.startsAt ? new Date(subscription.startsAt).toLocaleString("az-AZ") : "-"}</td>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{subscription.expiresAt ? new Date(subscription.expiresAt).toLocaleString("az-AZ") : "-"}</td>
                  </tr>
                ))
              ) : (
                <tr><td className='py-20 px-20 text-neutral-400' colSpan='4'>No subscriptions found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminPaymentsPage;
