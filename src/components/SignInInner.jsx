"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

const SignInInner = () => {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
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
    setMessage("");
    setError("");

    if (!form.email || !form.password) {
      setError("Email və şifrə tələb olunur.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await login(form);
      setMessage(response?.message || "Uğurla daxil oldunuz.");
      const next = searchParams.get("next");
      window.setTimeout(() => {
        router.replace(next?.startsWith("/") ? next : "/");
      }, 800);
    } catch {
      setError("Email və ya şifrə yanlışdır.");
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
                <h3 className='mb-16 text-neutral-500'>Xoş gəlmisiniz!</h3>
                <p className='text-neutral-500'>
                  Hesabınıza daxil olun və bizə qoşulun
                </p>
              </div>
              <form onSubmit={handleSubmit}>
                <div className='mb-24'>
                  <label
                    htmlFor='email'
                    className='fw-medium text-lg text-neutral-500 mb-16'
                  >
                    Email ünvanınızı daxil edin
                  </label>
                  <input
                    type='email'
                    name='email'
                    className='common-input rounded-pill'
                    id='email'
                    placeholder='Email ünvanınızı daxil edin...'
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
                    Şifrənizi daxil edin
                  </label>
                  <div className='position-relative'>
                    <input
                      type={passwordVisible ? "text" : "password"}
                      name='password'
                      className='common-input rounded-pill pe-44'
                      id='password'
                      placeholder='Şifrənizi daxil edin...'
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
                    Şifrəni unutmusunuz?
                  </Link>
                </div>
                <div className='mb-16'>
                  <p className='text-neutral-500'>
                    Hesabınız yoxdur?
                    <Link
                      href='/sign-up'
                      className='fw-semibold text-main-600 hover-text-decoration-underline'
                    >
                      Qeydiyyatdan keçin
                    </Link>
                  </p>
                </div>
                {message ? <p className='text-success-600 mb-0'>{message}</p> : null}
                {error ? <p className='text-danger mb-0'>{error}</p> : null}
                <div className='mt-40'>
                  <button
                    type='submit'
                    className='btn btn-main rounded-pill flex-center gap-8 mt-40'
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Daxil olunur..." : "Daxil ol"}
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
