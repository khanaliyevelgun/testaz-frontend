"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createUser, fetchUser, updateUser } from "@/lib/api";
import StaticText from "@/components/StaticText";


const roles = ["STUDENT", "PARENT", "COURSE", "PRIVATE_TUTOR", "SCHOOL_TEACHER", "ADMIN"];

const emptyForm = {
  fullName: "",
  email: "",
  phone: "",
  password: "",
  role: "STUDENT",
};

const AdminUserFormPage = ({ userId }) => {
  const router = useRouter();
  const isEdit = Boolean(userId);
  const [form, setForm] = useState(emptyForm);
  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isEdit) return;

    let isMounted = true;
    setIsLoading(true);
    fetchUser(userId)
      .then((user) => {
        if (!isMounted) return;
        setForm({
          fullName: user.fullName || user.name || "",
          email: user.email || "",
          phone: user.phone || "",
          password: "",
          role: (user.roles?.[0] || user.role || "STUDENT").toUpperCase(),
        });
      })
      .catch(() => {
        if (isMounted) setError("İstifadəçi yüklənmədi.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isEdit, userId]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const payload = {
        fullName: form.fullName.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        role: form.role,
      };

      if (isEdit) {
        await updateUser(userId, payload);
      } else {
        await createUser({ ...payload, password: form.password });
      }

      router.push("/admin/users");
      router.refresh();
    } catch {
      setError(isEdit ? "İstifadəçi yenilənmədi." : "İstifadəçi yaradılmadı.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='px-24 py-24'>
      <div className='bg-white rounded-10 px-24 py-24'>
        <div className='mb-24'>
          <h4 className='fw-semibold text-neutral-500 text-20 mb-4'>{isEdit ? <StaticText text={"Edit User"} /> : <StaticText text={"Create User"} />}</h4>
          <p className='text-14 text-neutral-400 mb-0'>{isEdit ? <StaticText text={"Update name, contact and role."} /> : <StaticText text={"Create an active user account."} />}</p>
        </div>

        {error ? <p className='text-danger mb-16'>{error}</p> : null}
        {isLoading ? (
          <p className='text-14 text-neutral-400 mb-0'><StaticText text={"Loading..."} /></p>
        ) : (
          <form className='row gy-4' onSubmit={handleSubmit}>
            <div className='col-md-6'>
              <label className='text-14 text-neutral-500 fw-medium mb-8'><StaticText text={"Full name"} /></label>
              <input name='fullName' className='common-input rounded-pill' value={form.fullName} onChange={handleChange} required />
            </div>
            <div className='col-md-6'>
              <label className='text-14 text-neutral-500 fw-medium mb-8'><StaticText text={"Email"} /></label>
              <input name='email' type='email' className='common-input rounded-pill' value={form.email} onChange={handleChange} />
            </div>
            <div className='col-md-6'>
              <label className='text-14 text-neutral-500 fw-medium mb-8'><StaticText text={"Phone"} /></label>
              <input name='phone' className='common-input rounded-pill' value={form.phone} onChange={handleChange} />
            </div>
            {!isEdit ? (
              <div className='col-md-6'>
                <label className='text-14 text-neutral-500 fw-medium mb-8'><StaticText text={"Password"} /></label>
                <input name='password' type='password' className='common-input rounded-pill' value={form.password} minLength={8} onChange={handleChange} required />
              </div>
            ) : null}
            <div className='col-md-6'>
              <label className='text-14 text-neutral-500 fw-medium mb-8'><StaticText text={"Role"} /></label>
              <select name='role' className='form-select rounded-pill border-neutral-40 text-14 py-11 px-16' value={form.role} onChange={handleChange}>
                {roles.map((role) => <option value={role} key={role}>{role.replaceAll("_", " ")}</option>)}
              </select>
            </div>
            <div className='col-12 d-flex align-items-center gap-12 mt-24'>
              <button type='submit' className='btn btn-main rounded-pill px-24' disabled={isSubmitting}>{isSubmitting ? <StaticText text={"Saving..."} /> : <StaticText text={"Save"} />}</button>
              <button type='button' className='px-18 py-10 border border-neutral-40 rounded-pill text-14 text-neutral-500 bg-white' onClick={() => router.push("/admin/users")}><StaticText text={"Cancel"} /></button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AdminUserFormPage;
