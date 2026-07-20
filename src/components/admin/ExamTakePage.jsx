"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchExamPreview, startExamByCode } from "@/lib/api";
import StaticText from "@/components/StaticText";


const ExamTakePage = ({ code, sessionBasePath = "/exam-session" }) => {
  const router = useRouter();
  const [preview, setPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    fetchExamPreview(code)
      .then((response) => {
        if (isMounted) setPreview(response);
      })
      .catch((requestError) => {
        if (isMounted) setError(requestError?.message || "Exam preview could not be loaded.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [code]);

  const start = async () => {
    setIsStarting(true);
    setError("");
    try {
      const session = await startExamByCode(code);
      const sessionId = session?.id || session?.sessionId;
      if (!sessionId) {
        throw new Error("Exam session id was not returned.");
      }
      router.replace(`${sessionBasePath}/${sessionId}`);
    } catch (requestError) {
      setError(requestError?.message || "Exam could not be started.");
      setIsStarting(false);
    }
  };

  return (
    <div className='px-24 py-24'>
      <div className='bg-white rounded-10 px-24 py-24'>
        {isLoading ? <p className='text-14 text-neutral-400 mb-0'><StaticText text={"Loading..."} /></p> : null}
        {error ? <div className='alert alert-danger text-14 py-10 mb-16'>{error}</div> : null}
        {preview ? (
          <>
            <div className='d-flex flex-wrap justify-content-between gap-16 mb-24'>
              <div>
                <h4 className='fw-semibold text-neutral-500 text-20 mb-4'>{preview.title || <StaticText text={"Exam preview"} />}</h4>
                <p className='text-14 text-neutral-400 mb-0'>{preview.description || <StaticText text={"Review the exam details before starting."} />}</p>
              </div>
              <button type='button' className='btn btn-main rounded-pill px-24' onClick={start} disabled={isStarting}>
                {isStarting ? <StaticText text={"Starting..."} /> : <StaticText text={"Start exam"} />}
              </button>
            </div>

            <div className='row gy-3 mb-20'>
              <div className='col-md-3'><div className='border border-neutral-30 rounded-8 p-16'><span className='text-13 text-neutral-400 d-block'><StaticText text={"Code"} /></span><strong>{preview.examCode || code}</strong></div></div>
              <div className='col-md-3'><div className='border border-neutral-30 rounded-8 p-16'><span className='text-13 text-neutral-400 d-block'><StaticText text={"Questions"} /></span><strong>{preview.totalQuestions ?? "-"}</strong></div></div>
              <div className='col-md-3'><div className='border border-neutral-30 rounded-8 p-16'><span className='text-13 text-neutral-400 d-block'><StaticText text={"Duration"} /></span><strong>{preview.durationMinutes ? `${preview.durationMinutes} min` : <StaticText text={"Untimed"} />}</strong></div></div>
              <div className='col-md-3'><div className='border border-neutral-30 rounded-8 p-16'><span className='text-13 text-neutral-400 d-block'><StaticText text={"Creator"} /></span><strong>{preview.creatorName || "-"}</strong></div></div>
            </div>

            <div className='mb-20'>
              <span className='text-14 text-neutral-500 fw-medium d-block mb-8'><StaticText text={"Subjects"} /></span>
              <div className='d-flex flex-wrap gap-8'>
                {(preview.subjects || []).map((subject) => <span className='px-12 py-6 rounded-pill bg-main-25 text-main-600 text-13' key={subject}>{subject}</span>)}
              </div>
            </div>

            <div className='table-responsive admin-users-table'>
              <table className='table mb-0'>
                <thead>
                  <tr>
                    <th className='text-12 fw-medium text-neutral-500 py-16 px-20'><StaticText text={"Section"} /></th>
                    <th className='text-12 fw-medium text-neutral-500 py-16 px-20'><StaticText text={"Subject"} /></th>
                    <th className='text-12 fw-medium text-neutral-500 py-16 px-20'><StaticText text={"Difficulty"} /></th>
                    <th className='text-12 fw-medium text-neutral-500 py-16 px-20'><StaticText text={"Type"} /></th>
                    <th className='text-12 fw-medium text-neutral-500 py-16 px-20'><StaticText text={"Questions"} /></th>
                  </tr>
                </thead>
                <tbody>
                  {(preview.sections || []).map((section, index) => (
                    <tr key={`${section.title}-${index}`}>
                      <td className='py-16 px-20 text-14 text-neutral-500'>{section.title || `Section ${index + 1}`}</td>
                      <td className='py-16 px-20 text-14 text-neutral-500'>{section.subject || "-"}</td>
                      <td className='py-16 px-20 text-14 text-neutral-500'>{section.difficulty || "-"}</td>
                      <td className='py-16 px-20 text-14 text-neutral-500'>{section.questionType || "-"}</td>
                      <td className='py-16 px-20 text-14 text-neutral-500'>{section.questionCount ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default ExamTakePage;
