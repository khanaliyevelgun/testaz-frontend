"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { resetPassword } from "@/lib/api";

const ResetPasswordInner = () => {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token =
    searchParams.get("token") ||
    searchParams.get("resetToken") ||
    searchParams.get("code") ||
    "";
  const email = searchParams.get("email") || "";

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!token) {
      setError("Şifrə yeniləmə linki yanlışdır və ya token yoxdur.");
      return;
    }

    if (form.password.length < 8) {
      setError("Şifrə ən azı 8 simvoldan ibarət olmalıdır.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Şifrələr uyğun gəlmir.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await resetPassword({
        token,
        password: form.password,
        ...(email ? { email } : {}),
      });
      setMessage(response?.message || "Şifrəniz uğurla yeniləndi.");
      window.setTimeout(() => {
        router.replace("/sign-in");
      }, 1500);
    } catch (requestError) {
      setError(requestError?.message || "Şifrə yenilənmədi. Linki yoxlayın və yenidən cəhd edin.");
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
                <h3 className='mb-16 text-neutral-500'>Yeni şifrə təyin edin</h3>
                <p className='text-neutral-500'>
                  Hesabınız üçün yeni şifrə yazın və təsdiqləyin.
                </p>
              </div>
              <form onSubmit={handleSubmit}>
                <div className='mb-24'>
                  <label
                    htmlFor='password'
                    className='fw-medium text-lg text-neutral-500 mb-16'
                  >
                    Yeni şifrə
                  </label>
                  <div className='position-relative'>
                    <input
                      type={passwordVisible ? "text" : "password"}
                      name='password'
                      className='common-input rounded-pill pe-44'
                      id='password'
                      placeholder='Yeni şifrənizi daxil edin...'
                      autoComplete='new-password'
                      value={form.password}
                      onChange={handleChange}
                    />
                    <span
                      className={`toggle-password position-absolute top-50 inset-inline-end-0 me-16 translate-middle-y ph-bold ${
                        passwordVisible ? "ph-eye" : "ph-eye-closed"
                      }`}
                      onClick={() => setPasswordVisible((currentValue) => !currentValue)}
                    ></span>
                  </div>
                </div>
                <div className='mb-24'>
                  <label
                    htmlFor='confirmPassword'
                    className='fw-medium text-lg text-neutral-500 mb-16'
                  >
                    Şifrəni təsdiqləyin
                  </label>
                  <div className='position-relative'>
                    <input
                      type={confirmPasswordVisible ? "text" : "password"}
                      name='confirmPassword'
                      className='common-input rounded-pill pe-44'
                      id='confirmPassword'
                      placeholder='Şifrənizi yenidən daxil edin...'
                      autoComplete='new-password'
                      value={form.confirmPassword}
                      onChange={handleChange}
                    />
                    <span
                      className={`toggle-password position-absolute top-50 inset-inline-end-0 me-16 translate-middle-y ph-bold ${
                        confirmPasswordVisible ? "ph-eye" : "ph-eye-closed"
                      }`}
                      onClick={() =>
                        setConfirmPasswordVisible((currentValue) => !currentValue)
                      }
                    ></span>
                  </div>
                </div>
                {message ? <p className='text-success-600 mb-0'>{message}</p> : null}
                {error ? <p className='text-danger mb-0'>{error}</p> : null}
                <div className='mb-16 mt-24'>
                  <p className='text-neutral-500'>
                    Hesabınıza daxil olmaq istəyirsiniz?
                    <Link
                      href='/sign-in'
                      className='fw-semibold text-main-600 hover-text-decoration-underline'
                    >
                      Daxil olun
                    </Link>
                  </p>
                </div>
                <div className='mt-40'>
                  <button
                    type='submit'
                    className='btn btn-main rounded-pill flex-center gap-8 mt-40'
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Yenilənir..." : "Şifrəni yenilə"}
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

export default ResetPasswordInner;
