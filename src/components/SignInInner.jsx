"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

const SignInInner = () => {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.email || !form.password) {
      setError("Email and password are required.");
      return;
    }

    setIsSubmitting(true);

    try {
      await login(form);
      const next = searchParams.get("next");
      router.replace(next?.startsWith("/") ? next : "/");
    } catch {
      setError("Invalid email or password.");
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
                <h3 className='mb-16 text-neutral-500'>Welcome Back!</h3>
                <p className='text-neutral-500'>
                  Sign in to your account and join us
                </p>
              </div>
              <form onSubmit={handleSubmit}>
                <div className='mb-24'>
                  <label
                    htmlFor='email'
                    className='fw-medium text-lg text-neutral-500 mb-16'
                  >
                    Enter Your Email ID
                  </label>
                  <input
                    type='email'
                    name='email'
                    className='common-input rounded-pill'
                    id='email'
                    placeholder='Enter Your Email...'
                    autoComplete='email'
                    value={form.email}
                    onChange={handleChange}
                  />
                </div>
                <div className='mb-16'>
                  <label
                    htmlFor='password'
                    className='fw-medium text-lg text-neutral-500 mb-16'
                  >
                    Enter Your Password
                  </label>
                  <div className='position-relative'>
                    <input
                      type={passwordVisible ? "text" : "password"}
                      name='password'
                      className='common-input rounded-pill pe-44'
                      id='password'
                      placeholder='Enter Your Password...'
                      autoComplete='current-password'
                      value={form.password}
                      onChange={handleChange}
                    />
                    <span
                      className={`toggle-password position-absolute top-50 inset-inline-end-0 me-16 translate-middle-y ph-bold ${
                        passwordVisible ? "ph-eye" : "ph-eye-closed"
                      }`}
                      onClick={togglePasswordVisibility}
                    ></span>
                  </div>
                </div>
                <div className='mb-16 text-end'>
                  <Link
                    href='/forgot-password'
                    className='text-warning-600 hover-text-decoration-underline'
                  >
                    Forget password
                  </Link>
                </div>
                <div className='mb-16'>
                  <p className='text-neutral-500'>
                    Don't have an account?
                    <Link
                      href='/sign-up'
                      className='fw-semibold text-main-600 hover-text-decoration-underline'
                    >
                      Sign Up
                    </Link>
                  </p>
                </div>
                {error ? <p className='text-danger mb-0'>{error}</p> : null}
                <div className='mt-40'>
                  <button
                    type='submit'
                    className='btn btn-main rounded-pill flex-center gap-8 mt-40'
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Signing In..." : "Sign In"}
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

export default SignInInner;
