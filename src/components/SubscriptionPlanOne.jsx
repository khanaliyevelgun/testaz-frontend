"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchSubscriptionPlans, startPaymentCheckout } from "@/lib/api";

const fallbackPlans = [
  { id: "trial", code: "TRIAL", nameAz: "Sınaq", priceAmount: 0, currency: "AZN", periodDays: 30, coversLinkedChildren: false },
];

const planLabels = {
  FAMILY_MONTHLY: "Ailə üçün aylıq plan",
  STUDENT_MONTHLY: "Şagird üçün aylıq plan",
};

const getPlanLabel = (plan) => {
  const suppliedLabel = plan.nameAz || plan.name;
  if (suppliedLabel && suppliedLabel !== plan.code) return suppliedLabel;
  return planLabels[plan.code] || "Abunəlik planı";
};

const formatPrice = (amount, currency = "AZN") =>
  `${Number(amount || 0).toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1")} ${currency}`;

const SubscriptionPlanOne = ({ className = "" }) => {
  const [plans, setPlans] = useState(fallbackPlans);
  const [isLoading, setIsLoading] = useState(true);
  const [checkoutCode, setCheckoutCode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    fetchSubscriptionPlans()
      .then((response) => {
        if (isMounted && response.length) setPlans(response);
      })
      .catch(() => {
        if (isMounted) setError("Planlar yüklənmədi.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCheckout = async (planCode) => {
    setCheckoutCode(planCode);
    setError("");

    try {
      const checkout = await startPaymentCheckout(planCode);
      if (checkout?.redirectUrl) {
        window.location.assign(checkout.redirectUrl);
      }
    } catch {
      setError("Ödəniş başlatmaq mümkün olmadı. Daxil olub yenidən yoxlayın.");
    } finally {
      setCheckoutCode("");
    }
  };

  return (
    <section className={`favorite-course py-96 ${className}`}>
      <div className='container'>
        <div className='section-heading text-center'>
          <div className='flex-align d-inline-flex gap-8 mb-16'>
            <span className='text-main-600 text-2xl d-flex'><i className='ph-bold ph-book-open' /></span>
          <h5 className='text-main-600 mb-0'>Planlarımız</h5>
          </div>
          <h2 className='mb-24'>Hər valideyn və tələbə üçün uyğun plan</h2>
          <p>Aktiv abunəlik planlarını seçin və ödənişə keçin.</p>
        </div>

        {error ? <p className='text-danger text-center mb-24'>{error}</p> : null}
        {isLoading ? <p className='text-center text-neutral-400 mb-0'>Planlar yüklənir...</p> : null}

        <div className='row gy-4 justify-content-center'>
          {plans.map((plan, index) => (
            <div className='col-xl-4 col-md-6 aos-init' data-aos='fade-up' data-aos-duration={600 + index * 200} key={plan.id || plan.code}>
              <div className='bg-white border border-neutral-30 animation-item rounded-16 p-12 h-100'>
                <div className='bg-main-25 p-32 rounded-16 transition-2 border border-neutral-30 overflow-hidden position-relative h-100 d-flex flex-column'>
                  <div className='w-84 h-84 bg-white p-16 box-shadow-md rounded-circle mx-auto d-inline-flex align-items-center justify-content-center position-relative text-main-600 text-44 border border-neutral-30'>
                    <i className='ph-bold ph-tag' />
                  </div>
                  <h3 className='fw-bold mb-12 mt-32 text-neutral-700 transition-2'>{getPlanLabel(plan)}</h3>
                  <h1 className='display-5 fw-bold mb-0 text-neutral-700 transition-2'>
                    {formatPrice(plan.priceAmount, plan.currency)}
                  </h1>
                  <span className='text-sm text-neutral-500 mt-8'>{plan.periodDays} gün</span>
                  <span className='d-block border border-neutral-30 my-24 border-dashed' />
                  <ul className='d-flex flex-column gap-16 flex-grow-1'>
                    <li className='flex-align gap-12 text-neutral-700'>
                      <img src='assets/images/icons/check.png' alt='' />
                      <span className='text-neutral-500 text-md fw-medium'>Aktiv test və nəticə funksiyaları</span>
                    </li>
                    <li className='flex-align gap-12 text-neutral-700'>
                      {plan.coversLinkedChildren ? <img src='assets/images/icons/check.png' alt='' /> : <i className='text-danger-600 ph-bold ph-x' />}
                      <span className='text-neutral-500 text-md fw-medium'>Bağlı uşaqları əhatə edir</span>
                    </li>
                  </ul>
                  <div className='mt-40'>
                    {Number(plan.priceAmount || 0) > 0 ? (
                      <button type='button' className='btn btn-main rounded-pill flex-align gap-8 w-100 justify-content-center' disabled={checkoutCode === plan.code} onClick={() => handleCheckout(plan.code)}>
                        {checkoutCode === plan.code ? "Başladılır..." : "Ödənişə keç"}
                        <i className='ph-bold ph-arrow-up-right d-flex text-lg' />
                      </button>
                    ) : (
                      <Link href='/sign-in' className='btn btn-main rounded-pill flex-align gap-8 w-100 justify-content-center'>
                        Başla
                        <i className='ph-bold ph-arrow-up-right d-flex text-lg' />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SubscriptionPlanOne;
