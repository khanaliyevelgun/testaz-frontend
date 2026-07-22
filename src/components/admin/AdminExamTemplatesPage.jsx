"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AdminRefreshButton from "@/components/admin/AdminRefreshButton";
import AdminRowActions from "@/components/admin/AdminRowActions";
import AdminPagination from "@/components/admin/AdminPagination";
import { fetchExamTemplates } from "@/lib/api";
import { formatDateTime as formatDate } from "@/lib/format";
import StaticText from "@/components/StaticText";


const countQuestions = (template) =>
  (template?.config?.sections || []).reduce(
    (sectionTotal, section) =>
      sectionTotal + (section.topics || []).reduce((topicTotal, topic) => topicTotal + Number(topic.questionCount || 0), 0),
    0
  );

const AdminExamTemplatesPage = () => {
  const [templates, setTemplates] = useState([]);
  const [meta, setMeta] = useState({ page: 1, perPage: 10, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadTemplates = async (page = 1) => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetchExamTemplates({ page, perPage: 10 });
      setTemplates(response.data || []);
      setMeta(response.meta || { page, perPage: 10, total: 0, totalPages: 1 });
    } catch (requestError) {
      setError(requestError?.message || "Templates could not be loaded.");
      setTemplates([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates(1);
  }, []);

  const actionsFor = (template) => [
    { label: "Create exam", href: `/admin/exams/new?templateId=${template.templateId}`, icon: "ph ph-plus-circle" },
  ];

  return (
    <div className='px-24 py-24'>
      <div className='bg-white rounded-10 px-24 py-24'>
        <div className='d-flex flex-wrap align-items-center justify-content-between gap-16 mb-24'>
          <div>
            <h4 className='fw-semibold text-neutral-500 text-20 mb-4'><StaticText text={"Exam Templates"} /></h4>
            <p className='text-14 text-neutral-400 mb-0'><StaticText text={"Saved reusable exam configurations."} /></p>
          </div>
          <div className='d-flex flex-wrap align-items-center gap-8'>
            <Link href='/admin/exams' className='px-18 py-10 border border-neutral-40 rounded-pill text-14 text-neutral-500 bg-white'><StaticText text={"Exams"} /></Link>
            <Link href='/admin/exams/new' className='btn btn-main rounded-pill px-20'><StaticText text={"Create Exam"} /></Link>
            <AdminRefreshButton isLoading={isLoading} onClick={() => loadTemplates(meta.page)} />
          </div>
        </div>

        {error ? <p className='text-danger mb-16'>{error}</p> : null}

        <div className='table-responsive admin-users-table'>
          <table className='table mb-0'>
            <thead>
              <tr>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'><StaticText text={"Template"} /></th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'><StaticText text={"Sections"} /></th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'><StaticText text={"Questions"} /></th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'><StaticText text={"Duration"} /></th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20'><StaticText text={"Updated"} /></th>
                <th className='text-12 fw-medium text-neutral-500 py-16 px-20 text-end'><StaticText text={"Action"} /></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td className='py-20 px-20 text-neutral-400' colSpan='6'><StaticText text={"Loading..."} /></td></tr>
              ) : templates.length ? (
                templates.map((template) => (
                  <tr key={template.templateId}>
                    <td className='py-16 px-20'>
                      <Link href={`/admin/exams/new?templateId=${template.templateId}`} className='text-14 fw-medium text-neutral-500'>{template.name || <StaticText text={"Untitled template"} />}</Link>
                      <span className='d-block text-12 text-neutral-400'>{template.templateId}</span>
                    </td>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{template.config?.sections?.length || 0}</td>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{countQuestions(template)}</td>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{template.config?.durationMinutes ? `${template.config.durationMinutes} min` : <StaticText text={"Untimed"} />}</td>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{formatDate(template.updatedAt || template.createdAt)}</td>
                    <td className='py-16 px-20'><div className='d-flex justify-content-end'><AdminRowActions items={actionsFor(template)} /></div></td>
                  </tr>
                ))
              ) : (
                <tr><td className='py-20 px-20 text-neutral-400' colSpan='6'><StaticText text={"No templates found."} /></td></tr>
              )}
            </tbody>
          </table>
        </div>

        <AdminPagination meta={meta} onPageChange={loadTemplates} />
      </div>
    </div>
  );
};

export default AdminExamTemplatesPage;
