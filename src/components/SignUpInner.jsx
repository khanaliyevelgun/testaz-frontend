"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

const SignUpInner = () => {
  const [passwordVisible, setPasswordVisible] = useState(false);
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

    if (!form.firstName || !form.email || form.password.length < 8) {
      setError("Ad, düzgün email və ən azı 8 simvoldan ibarət şifrə tələb olunur.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await register({
        name: `${form.firstName} ${form.lastName}`.trim(),
        email: form.email,
        password: form.password,
      });
      setMessage(response?.message || "Qeydiyyat uğurla tamamlandı.");
      const next = searchParams.get("next");
      window.setTimeout(() => {
        router.replace(next?.startsWith("/") ? next : "/");
      }, 800);
    } catch {
      setError("Qeydiyyat alınmadı. Məlumatlarınızı yoxlayın.");
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
                <h3 className='mb-16 text-neutral-500'>Başlayaq!</h3>
                <p className='text-neutral-500'>
                  Onlayn müraciətə başlamaq üçün email ünvanınızı daxil edin
                </p>
              </div>
              <form onSubmit={handleSubmit}>
                <div className='row gy-4'>
                  <div className='col-sm-6'>
                    <label
                      htmlFor='fname'
                      className='fw-medium text-lg text-neutral-500 mb-16'
                    >
                      Ad
                    </label>
                    <input
                      type='text'
                      name='firstName'
                      className='common-input rounded-pill'
                      id='fname'
                      placeholder='Adınızı daxil edin'
                      autoComplete='given-name'
                      value={form.firstName}
                      onChange={handleChange}
                    />
                  </div>
                  <div className='col-sm-6'>
                    <label
                      htmlFor='lname'
                      className='fw-medium text-lg text-neutral-500 mb-16'
                    >
                      Soyad
                    </label>
                    <input
                      type='text'
                      name='lastName'
                      className='common-input rounded-pill'
                      id='lname'
                      placeholder='Soyadınızı daxil edin'
                      autoComplete='family-name'
                      value={form.lastName}
                      onChange={handleChange}
                    />
                  </div>
                  <div className='col-sm-12'>
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
                  <div className='col-sm-12'>
                    <label
                      htmlFor='password'
                      className='fw-medium text-lg text-neutral-500 mb-16'
                    >
                      Şifrə
                    </label>
                    <div className='position-relative'>
                      <input
                        type={passwordVisible ? "text" : "password"}
                        name='password'
                        className='common-input rounded-pill pe-44'
                        id='password'
                        placeholder='Şifrənizi daxil edin...'
                        autoComplete='new-password'
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
                  <div className='col-sm-12'>
                    <p className='text-neutral-500 mt-8'>
                      Hesabınız var?
                      <Link
                        href='/sign-in'
                        className='fw-semibold text-main-600 hover-text-decoration-underline'
                      >
                        Daxil olun
                      </Link>
                    </p>
                  </div>
                  {error ? (
                    <div className='col-sm-12'>
                      <p className='text-danger mb-0'>{error}</p>
                    </div>
                  ) : null}
                  {message ? (
                    <div className='col-sm-12'>
                      <p className='text-success-600 mb-0'>{message}</p>
                    </div>
                  ) : null}
                  <div className='col-sm-12'>
                    <div className='mt-20'>
                      <button
                        type='submit'
                        className='btn btn-main rounded-pill flex-center gap-8'
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Qeydiyyat aparılır..." : "Qeydiyyatdan keç"}
                        <i className='ph-bold ph-arrow-up-right d-flex text-lg' />
                      </button>
                    </div>
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
