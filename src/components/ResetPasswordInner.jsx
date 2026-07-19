"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { resetPassword } from "@/lib/api";

const ResetPasswordInner = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [form, setForm] = useState({
    login: searchParams.get("email") || searchParams.get("login") || "",
    code: searchParams.get("token") || searchParams.get("resetToken") || searchParams.get("code") || "",
    password: "",
    confirmPassword: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!form.login.trim() || !form.code.trim()) {
      setError("Email/telefon və təsdiq kodu tələb olunur.");
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
      await resetPassword({
        login: form.login.trim(),
        code: form.code.trim(),
        newPassword: form.password,
      });
      setMessage("Şifrəniz uğurla yeniləndi.");
      window.setTimeout(() => router.replace("/sign-in"), 1200);
    } catch (requestError) {
      setError(requestError?.message || "Şifrə yenilənmədi. Kodu yoxlayın və yenidən cəhd edin.");
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
                <p className='text-neutral-500'>Göndərilən kodu və yeni şifrənizi daxil edin.</p>
              </div>
              <form onSubmit={handleSubmit}>
                <div className='mb-24'>
                  <label htmlFor='login' className='d-block fw-medium text-lg text-neutral-500 mb-16'>Email və ya telefon</label>
                  <input
                    type='text'
                    name='login'
                    className='common-input rounded-pill w-100'
                    id='login'
                    autoComplete='username'
                    value={form.login}
                    onChange={handleChange}
                  />
                </div>
                <div className='mb-24'>
                  <label htmlFor='code' className='d-block fw-medium text-lg text-neutral-500 mb-16'>Təsdiq kodu</label>
                  <input
                    type='text'
                    name='code'
                    className='common-input rounded-pill w-100'
                    id='code'
                    inputMode='numeric'
                    autoComplete='one-time-code'
                    value={form.code}
                    onChange={handleChange}
                  />
                </div>
                <div className='mb-24'>
                  <label htmlFor='password' className='d-block fw-medium text-lg text-neutral-500 mb-16'>Yeni şifrə</label>
                  <div className='position-relative'>
                    <input
                      type={passwordVisible ? "text" : "password"}
                      name='password'
                      className='common-input rounded-pill pe-44 w-100'
                      id='password'
                      autoComplete='new-password'
                      value={form.password}
                      onChange={handleChange}
                    />
                    <button
                      type='button'
                      className={`toggle-password position-absolute top-50 inset-inline-end-0 me-16 translate-middle-y ph-bold border-0 bg-transparent ${
                        passwordVisible ? "ph-eye" : "ph-eye-closed"
                      }`}
                      aria-label={passwordVisible ? "Şifrəni gizlət" : "Şifrəni göstər"}
                      onClick={() => setPasswordVisible((current) => !current)}
                    />
                  </div>
                </div>
                <div className='mb-24'>
                  <label htmlFor='confirmPassword' className='d-block fw-medium text-lg text-neutral-500 mb-16'>Şifrəni təsdiqləyin</label>
                  <input
                    type='password'
                    name='confirmPassword'
                    className='common-input rounded-pill w-100'
                    id='confirmPassword'
                    autoComplete='new-password'
                    value={form.confirmPassword}
                    onChange={handleChange}
                  />
                </div>
                {message ? <p className='text-success-600'>{message}</p> : null}
                {error ? <p className='text-danger'>{error}</p> : null}
                <button type='submit' className='btn btn-main rounded-pill flex-center gap-8 mt-20' disabled={isSubmitting}>
                  {isSubmitting ? "Yenilənir..." : "Şifrəni yenilə"}
                  <i className='ph-bold ph-arrow-up-right d-flex text-lg' />
                </button>
                <p className='text-neutral-500 mt-24 mb-0'>
                  Şifrənizi xatırladınız?{" "}
                  <Link href='/sign-in' className='fw-semibold text-main-600'>Daxil olun</Link>
                </p>
              </form>
            </div>
          </div>
          <div className='col-lg-6 d-lg-block d-none'>
            <div className='account-img'><img src='assets/images/thumbs/account-img.png' alt='' /></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordInner;
