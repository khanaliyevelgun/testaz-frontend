"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import StaticText from "@/components/StaticText";
import { useAuth } from "@/hooks/useAuth";
import { fetchMySubscriptions } from "@/lib/api";

/**
 * Landing page the payment provider redirects the user back to after checkout
 * (backend `app.payment.return-url`, currently `.../payment/return?ref=<providerRef>`).
 *
 * With the MOCK provider there is no automatic webhook, so a returning user's
 * subscription is still PENDING here — activation happens only when a (separately
 * POSTed) signed webhook reaches the backend. The page therefore does not claim
 * "success" on arrival: it shows a "verifying" state and polls the user's own
 * subscriptions for a short window, flipping to "active" if/when one goes ACTIVE.
 * A real provider (Payriff, §26) may change the return contract; this page reads
 * only the generic `ref`/`status` params, so it degrades cleanly either way.
 */

const POLL_INTERVAL_MS = 3000;
const MAX_POLLS = 5;

// Statuses some providers pass on the return URL. The mock provider passes none,
// so an absent status is treated as "pending verification", never a failure.
const FAILED_STATUSES = new Set(["FAILED", "FAILURE", "CANCELED", "CANCELLED", "DECLINED", "ERROR"]);
const SUCCESS_STATUSES = new Set(["SUCCESS", "SUCCEEDED", "COMPLETED", "PAID", "OK"]);

const PaymentReturnInner = () => {
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const providerRef = searchParams.get("ref") || searchParams.get("providerRef") || "";
  const returnedStatus = (searchParams.get("status") || "").toUpperCase();

  // "verifying" | "active" | "pending" | "failed"
  const [state, setState] = useState(FAILED_STATUSES.has(returnedStatus) ? "failed" : "verifying");
  const pollsRef = useRef(0);

  useEffect(() => {
    if (FAILED_STATUSES.has(returnedStatus)) {
      setState("failed");
      return undefined;
    }

    // Not signed in (checkout can be started from the public pricing page): we
    // cannot read the user's subscriptions, so we can only acknowledge the return.
    if (!user) {
      setState(SUCCESS_STATUSES.has(returnedStatus) ? "active" : "pending");
      return undefined;
    }

    let isMounted = true;
    let timer = null;

    const hasLiveSubscription = (subscriptions) =>
      Array.isArray(subscriptions) &&
      subscriptions.some((subscription) => {
        const status = String(subscription?.status || "").toUpperCase();
        if (status !== "ACTIVE") return false;
        const expiresAt = subscription?.expiresAt ? new Date(subscription.expiresAt).getTime() : null;
        return expiresAt === null || Number.isNaN(expiresAt) || expiresAt > Date.now();
      });

    const poll = () => {
      fetchMySubscriptions()
        .then((subscriptions) => {
          if (!isMounted) return;
          if (hasLiveSubscription(subscriptions)) {
            setState("active");
            return;
          }
          pollsRef.current += 1;
          if (pollsRef.current >= MAX_POLLS) {
            setState("pending");
            return;
          }
          timer = setTimeout(poll, POLL_INTERVAL_MS);
        })
        .catch(() => {
          if (!isMounted) return;
          // A read failure should not look like a payment failure — the payment
          // may still be processing. Stop polling and show the neutral pending state.
          setState("pending");
        });
    };

    poll();

    return () => {
      isMounted = false;
      if (timer) clearTimeout(timer);
    };
  }, [user, returnedStatus]);

  const subscriptionsHref = user ? "/admin/subscriptions" : "/pricing-plan";

  return (
    <section className='py-120'>
      <div className='container'>
        <div className='row justify-content-center'>
          <div className='col-lg-6 col-md-8'>
            <div className='bg-white border border-neutral-30 rounded-16 p-40 text-center'>
              {state === "verifying" ? (
                <>
                  <div className='w-84 h-84 bg-main-25 rounded-circle mx-auto d-inline-flex align-items-center justify-content-center text-main-600 text-44 mb-24'>
                    <i className='ph-bold ph-hourglass-medium' />
                  </div>
                  <h3 className='mb-16'><StaticText text={"Ödəniş yoxlanılır"} /></h3>
                  <p className='text-neutral-500 mb-0'>
                    <StaticText text={"Ödənişiniz təsdiqlənir. Bu bir neçə saniyə çəkə bilər."} />
                  </p>
                </>
              ) : null}

              {state === "active" ? (
                <>
                  <div className='w-84 h-84 bg-success-100 rounded-circle mx-auto d-inline-flex align-items-center justify-content-center text-success-600 text-44 mb-24'>
                    <i className='ph-bold ph-check-circle' />
                  </div>
                  <h3 className='mb-16'><StaticText text={"Ödəniş uğurlu oldu"} /></h3>
                  <p className='text-neutral-500 mb-32'>
                    <StaticText text={"Abunəliyiniz aktivləşdirildi. İndi bütün funksiyalardan istifadə edə bilərsiniz."} />
                  </p>
                </>
              ) : null}

              {state === "pending" ? (
                <>
                  <div className='w-84 h-84 bg-warning-100 rounded-circle mx-auto d-inline-flex align-items-center justify-content-center text-warning-600 text-44 mb-24'>
                    <i className='ph-bold ph-clock-countdown' />
                  </div>
                  <h3 className='mb-16'><StaticText text={"Ödəniş emal olunur"} /></h3>
                  <p className='text-neutral-500 mb-32'>
                    <StaticText text={"Ödənişiniz qəbul edildi və hazırda emal olunur. Abunəliyiniz təsdiqləndikdən sonra aktivləşəcək."} />
                  </p>
                </>
              ) : null}

              {state === "failed" ? (
                <>
                  <div className='w-84 h-84 bg-danger-100 rounded-circle mx-auto d-inline-flex align-items-center justify-content-center text-danger-600 text-44 mb-24'>
                    <i className='ph-bold ph-x-circle' />
                  </div>
                  <h3 className='mb-16'><StaticText text={"Ödəniş tamamlanmadı"} /></h3>
                  <p className='text-neutral-500 mb-32'>
                    <StaticText text={"Ödəniş tamamlanmadı və ya ləğv edildi. Yenidən cəhd edə bilərsiniz."} />
                  </p>
                </>
              ) : null}

              {providerRef ? (
                <p className='text-neutral-400 text-sm mb-24'>
                  <StaticText text={"İstinad"} />: {providerRef}
                </p>
              ) : null}

              <div className='flex-align gap-16 justify-content-center flex-wrap'>
                <Link href={subscriptionsHref} className='btn btn-main rounded-pill flex-align gap-8 justify-content-center'>
                  <StaticText text={"Abunəliklərə qayıt"} />
                  <i className='ph-bold ph-arrow-right d-flex text-lg' />
                </Link>
                {state === "failed" ? (
                  <Link href='/pricing-plan' className='btn btn-outline-main rounded-pill flex-align gap-8 justify-content-center'>
                    <StaticText text={"Planları gör"} />
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PaymentReturnInner;
