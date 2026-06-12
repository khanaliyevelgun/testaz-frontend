"use client";

import { useState } from "react";
import Link from "next/link";
import { forgotPassword } from "@/lib/api";

const ForgotPasswordInner = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!email) {
      setError("Email is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await forgotPassword({ email });
      setMessage(response?.message || "If the account exists, a reset link has been sent.");
    } catch {
      setError("Password reset request failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='account py-120 position-relative'>
      <div className='container'>
        <div className='row gy-4 align-items-center'>
          <div className='col-lg-6'>
            <div className='bg-main-25 border border-neutral-30 rounded-8 p-32'>
              <div className='mb-40'>
                <h3 className='mb-16 text-neutral-500'>Reset Password</h3>
                <p className='text-neutral-500'>
                  Enter your email address to receive password reset instructions.
                </p>
              </div>
              <form onSubmit={handleSubmit}>
                <div className='mb-24'>
                  <label htmlFor='email' className='fw-medium text-lg text-neutral-500 mb-16'>
                    Enter Your Email ID
                  </label>
                  <input
                    type='email'
                    name='email'
                    className='common-input rounded-pill'
                    id='email'
                    placeholder='Enter Your Email...'
                    autoComplete='email'
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>
                {message ? <p className='text-success mb-0'>{message}</p> : null}
                {error ? <p className='text-danger mb-0'>{error}</p> : null}
                <div className='mb-16 mt-24'>
                  <p className='text-neutral-500'>
                    Remembered your password?
                    <Link
                      href='/sign-in'
                      className='fw-semibold text-main-600 hover-text-decoration-underline'
                    >
                      Sign In
                    </Link>
                  </p>
                </div>
                <div className='mt-40'>
                  <button
                    type='submit'
                    className='btn btn-main rounded-pill flex-center gap-8 mt-40'
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Sending..." : "Send Reset Link"}
                    <i className='ph-bold ph-arrow-up-right d-flex text-lg' />
                  </button>
                </div>
              </form>
            </div>
          </div>
          <div className='col-lg-6 d-lg-block d-none'>
            <div className='account-img'>
              <img src='assets/images/thumbs/account-img.png' alt='' />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordInner;
