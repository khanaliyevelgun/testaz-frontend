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
    setError("");

    if (!form.firstName || !form.email || form.password.length < 8) {
      setError("Name, valid email, and at least 8 character password are required.");
      return;
    }

    setIsSubmitting(true);

    try {
      await register({
        name: `${form.firstName} ${form.lastName}`.trim(),
        email: form.email,
        password: form.password,
      });
      const next = searchParams.get("next");
      router.replace(next?.startsWith("/") ? next : "/");
    } catch {
      setError("Registration failed. Please check your details.");
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
                <h3 className='mb-16 text-neutral-500'>Let's Get Started!</h3>
                <p className='text-neutral-500'>
                  Please Enter your Email Address to Start your Online
                  Application
                </p>
              </div>
              <form onSubmit={handleSubmit}>
                <div className='row gy-4'>
                  <div className='col-sm-6'>
                    <label
                      htmlFor='fname'
                      className='fw-medium text-lg text-neutral-500 mb-16'
                    >
                      First Name
                    </label>
                    <input
                      type='text'
                      name='firstName'
                      className='common-input rounded-pill'
                      id='fname'
                      placeholder='Enter Your First Name'
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
                      Last Name
                    </label>
                    <input
                      type='text'
                      name='lastName'
                      className='common-input rounded-pill'
                      id='lname'
                      placeholder='Enter Your Last Name'
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
                  <div className='col-sm-12'>
                    <label
                      htmlFor='password'
                      className='fw-medium text-lg text-neutral-500 mb-16'
                    >
                      Password
                    </label>
                    <div className='position-relative'>
                      <input
                        type={passwordVisible ? "text" : "password"}
                        name='password'
                        className='common-input rounded-pill pe-44'
                        id='password'
                        placeholder='Enter Your Password...'
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
                      Have an accounts?
                      <Link
                        href='/sign-in'
                        className='fw-semibold text-main-600 hover-text-decoration-underline'
                      >
                        Sign In
                      </Link>
                    </p>
                  </div>
                  {error ? (
                    <div className='col-sm-12'>
                      <p className='text-danger mb-0'>{error}</p>
                    </div>
                  ) : null}
                  <div className='col-sm-12'>
                    <div className='mt-20'>
                      <button
                        type='submit'
                        className='btn btn-main rounded-pill flex-center gap-8'
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Signing Up..." : "Sign Up"}
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
