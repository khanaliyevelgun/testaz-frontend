"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createSubject, fetchSubject, updateSubject } from "@/lib/api";
import StaticText from "@/components/StaticText";


const emptyForm = { code: "", nameAz: "", nameEn: "" };

const AdminSubjectFormPage = ({ subjectId }) => {
  const router = useRouter();
  const isEdit = Boolean(subjectId);
  const [form, setForm] = useState(emptyForm);
  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isEdit) return;

    let isMounted = true;
    setIsLoading(true);
    fetchSubject(subjectId)
      .then((subject) => {
        if (!isMounted) return;
        setForm({
          code: subject.code || "",
          nameAz: subject.nameAz || "",
          nameEn: subject.nameEn || "",
        });
      })
      .catch(() => {
        if (isMounted) setError("Fənn yüklənmədi.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isEdit, subjectId]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      if (isEdit) {
        await updateSubject(subjectId, {
          nameAz: form.nameAz.trim(),
          nameEn: form.nameEn.trim(),
        });
      } else {
        await createSubject({
          code: form.code.trim(),
          nameAz: form.nameAz.trim(),
          nameEn: form.nameEn.trim(),
        });
      }

      router.push("/admin/subjects");
      router.refresh();
    } catch {
      setError(isEdit ? "Fənn yenilənmədi." : "Fənn yaradılmadı.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='px-24 py-24'>
      <div className='bg-white rounded-10 px-24 py-24'>
        <div className='mb-24'>
          <h4 className='fw-semibold text-neutral-500 text-20 mb-4'>{isEdit ? <StaticText text={"Edit Subject"} /> : <StaticText text={"Create Subject"} />}</h4>
          <p className='text-14 text-neutral-400 mb-0'>{isEdit ? <StaticText text={"Rename subject labels."} /> : <StaticText text={"Create a dynamic subject."} />}</p>
        </div>

        {error ? <p className='text-danger mb-16'>{error}</p> : null}
        {isLoading ? (
          <p className='text-14 text-neutral-400 mb-0'><StaticText text={"Loading..."} /></p>
        ) : (
          <form className='row gy-4' onSubmit={handleSubmit}>
            <div className='col-md-4'>
              <label className='text-14 text-neutral-500 fw-medium mb-8'><StaticText text={"Code"} /></label>
              <input name='code' className='common-input rounded-pill' value={form.code} onChange={handleChange} disabled={isEdit} required />
            </div>
            <div className='col-md-4'>
              <label className='text-14 text-neutral-500 fw-medium mb-8'><StaticText text={"Name AZ"} /></label>
              <input name='nameAz' className='common-input rounded-pill' value={form.nameAz} onChange={handleChange} required />
            </div>
            <div className='col-md-4'>
              <label className='text-14 text-neutral-500 fw-medium mb-8'><StaticText text={"Name EN"} /></label>
              <input name='nameEn' className='common-input rounded-pill' value={form.nameEn} onChange={handleChange} required />
            </div>
            <div className='col-12 d-flex align-items-center gap-12 mt-24'>
              <button type='submit' className='btn btn-main rounded-pill px-24' disabled={isSubmitting}>{isSubmitting ? <StaticText text={"Saving..."} /> : <StaticText text={"Save"} />}</button>
              <button type='button' className='px-18 py-10 border border-neutral-40 rounded-pill text-14 text-neutral-500 bg-white' onClick={() => router.push("/admin/subjects")}><StaticText text={"Cancel"} /></button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AdminSubjectFormPage;
