"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { confirmVerification, sendVerification } from "@/lib/api";

const SignUpInner = () => {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [phase, setPhase] = useState("register");
  const [verificationCode, setVerificationCode] = useState("");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const completeVerification = async () => {
    if (!verificationCode.trim()) {
      setError("Təsdiq kodunu daxil edin.");
      return;
    }

    setIsSubmitting(true);
    try {
      await confirmVerification({ email: form.email, code: verificationCode.trim() });
      setMessage("Hesabınız təsdiqləndi. Daxil olma səhifəsinə yönləndirilirsiniz.");
      const next = searchParams.get("next");
      window.setTimeout(() => {
        const query = next?.startsWith("/") ? `?next=${encodeURIComponent(next)}` : "";
        router.replace(`/sign-in${query}`);
      }, 1000);
    } catch (requestError) {
      setError(requestError?.message || "Təsdiq kodu qəbul edilmədi.");
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    if (phase === "verify") {
      await completeVerification();
      return;
    }

    if (!form.firstName.trim() || !form.email.trim() || form.password.length < 8) {
      setError("Ad, düzgün email və ən azı 8 simvoldan ibarət şifrə tələb olunur.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await register({
        name: `${form.firstName} ${form.lastName}`.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      await sendVerification({ email: form.email.trim() });
      setPhase("verify");
      setMessage(response?.message || "Qeydiyyat tamamlandı. Göndərilən təsdiq kodunu daxil edin.");
    } catch (requestError) {
      setError(requestError?.message || "Qeydiyyat alınmadı. Məlumatlarınızı yoxlayın.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resendCode = async () => {
    setIsSubmitting(true);
    setMessage("");
    setError("");
    try {
      await sendVerification({ email: form.email.trim() });
      setMessage("Yeni təsdiq kodu göndərildi.");
    } catch (requestError) {
      setError(requestError?.message || "Kod yenidən göndərilə bilmədi.");
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
                <h3 className='mb-16 text-neutral-500'>
                  {phase === "verify" ? "Hesabınızı təsdiqləyin" : "Başlayaq!"}
                </h3>
                <p className='text-neutral-500'>
                  {phase === "verify"
                    ? `${form.email} ünvanına göndərilən kodu daxil edin.`
                    : "Hesab yaratmaq üçün məlumatlarınızı daxil edin."}
                </p>
              </div>

              <form onSubmit={handleSubmit}>
                <div className='row gy-4'>
                  {phase === "register" ? (
                    <>
                      <div className='col-sm-6'>
                        <label htmlFor='fname' className='d-block fw-medium text-lg text-neutral-500 mb-16'>Ad</label>
                        <input
                          type='text'
                          name='firstName'
                          className='common-input rounded-pill w-100'
                          id='fname'
                          placeholder='Adınızı daxil edin'
                          autoComplete='given-name'
                          value={form.firstName}
                          onChange={handleChange}
                        />
                      </div>
                      <div className='col-sm-6'>
                        <label htmlFor='lname' className='d-block fw-medium text-lg text-neutral-500 mb-16'>Soyad</label>
                        <input
                          type='text'
                          name='lastName'
                          className='common-input rounded-pill w-100'
                          id='lname'
                          placeholder='Soyadınızı daxil edin'
                          autoComplete='family-name'
                          value={form.lastName}
                          onChange={handleChange}
                        />
                      </div>
                      <div className='col-sm-12'>
                        <label htmlFor='email' className='d-block fw-medium text-lg text-neutral-500 mb-16'>Email ünvanı</label>
                        <input
                          type='email'
                          name='email'
                          className='common-input rounded-pill w-100'
                          id='email'
                          placeholder='Email ünvanınızı daxil edin...'
                          autoComplete='email'
                          value={form.email}
                          onChange={handleChange}
                        />
                      </div>
                      <div className='col-sm-12'>
                        <label htmlFor='password' className='d-block fw-medium text-lg text-neutral-500 mb-16'>Şifrə</label>
                        <div className='position-relative'>
                          <input
                            type={passwordVisible ? "text" : "password"}
                            name='password'
                            className='common-input rounded-pill pe-44 w-100'
                            id='password'
                            placeholder='Şifrənizi daxil edin...'
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
                    </>
                  ) : (
                    <div className='col-sm-12'>
                      <label htmlFor='verificationCode' className='d-block fw-medium text-lg text-neutral-500 mb-16'>Təsdiq kodu</label>
                      <input
                        type='text'
                        className='common-input rounded-pill w-100'
                        id='verificationCode'
                        inputMode='numeric'
                        autoComplete='one-time-code'
                        placeholder='Kodu daxil edin...'
                        value={verificationCode}
                        onChange={(event) => setVerificationCode(event.target.value)}
                      />
                      <button
                        type='button'
                        className='border-0 bg-transparent text-main-600 text-14 mt-12 p-0'
                        disabled={isSubmitting}
                        onClick={resendCode}
                      >
                        Kodu yenidən göndər
                      </button>
                    </div>
                  )}

                  {error ? <div className='col-sm-12'><p className='text-danger mb-0'>{error}</p></div> : null}
                  {message ? <div className='col-sm-12'><p className='text-success-600 mb-0'>{message}</p></div> : null}

                  <div className='col-sm-12'>
                    <button type='submit' className='btn btn-main rounded-pill flex-center gap-8 mt-20' disabled={isSubmitting}>
                      {phase === "verify"
                        ? isSubmitting ? "Təsdiqlənir..." : "Kodu təsdiqlə"
                        : isSubmitting ? "Qeydiyyat aparılır..." : "Qeydiyyatdan keç"}
                      <i className='ph-bold ph-arrow-up-right d-flex text-lg' />
                    </button>
                  </div>
                  <div className='col-sm-12'>
                    <p className='text-neutral-500 mb-0'>
                      Hesabınız var?{" "}
                      <Link href='/sign-in' className='fw-semibold text-main-600 hover-text-decoration-underline'>
                        Daxil olun
                      </Link>
                    </p>
                  </div>
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

export default SignUpInner;
