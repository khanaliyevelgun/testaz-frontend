"use client";

import Link from "next/link";
import { useState } from "react";
import AdminRefreshButton from "@/components/admin/AdminRefreshButton";
import AdminStatusBadge from "@/components/admin/AdminStatusBadge";
import OrganizationSelector, {
  useOrganizationSelection,
} from "@/components/admin/OrganizationSelector";
import {
  createOrganization,
  updateOrganizationNotificationSetting,
} from "@/lib/api";
import StaticText from "@/components/StaticText";


const organizationTypes = [
  { value: "COURSE", label: "Course" },
  { value: "PRIVATE_TUTOR", label: "Private tutor" },
  { value: "SCHOOL", label: "School" },
];

const OrganizationManagementPage = () => {
  const {
    organizations,
    selectedOrganization,
    selectedOrganizationId,
    selectOrganization,
    loadOrganizations,
    isLoadingOrganizations,
    organizationError,
  } = useOrganizationSelection();
  const [form, setForm] = useState({ name: "", type: "COURSE" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updatingOrganizationId, setUpdatingOrganizationId] = useState("");
  const [notice, setNotice] = useState("");
  const [actionError, setActionError] = useState("");

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    const name = form.name.trim();

    setNotice("");
    setActionError("");

    if (!name) {
      setActionError("Təşkilatın adı tələb olunur.");
      return;
    }

    if (name.length > 200) {
      setActionError("Təşkilatın adı 200 simvoldan uzun ola bilməz.");
      return;
    }

    setIsSubmitting(true);
    try {
      const createdOrganization = await createOrganization({
        name,
        type: form.type,
      });
      setForm({ name: "", type: form.type });
      setNotice("Təşkilat uğurla yaradıldı.");
      await loadOrganizations(createdOrganization?.id || "");
    } catch (requestError) {
      setActionError(requestError?.message || "Təşkilat yaradılmadı.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleCompletionNotification = async (organization) => {
    const nextValue = !organization.notifyOnMemberCompletion;
    setUpdatingOrganizationId(organization.id);
    setNotice("");
    setActionError("");

    try {
      await updateOrganizationNotificationSetting(organization.id, nextValue);
      setNotice(
        nextValue
          ? "Completion notifications enabled."
          : "Completion notifications disabled."
      );
      await loadOrganizations(organization.id);
    } catch (requestError) {
      setActionError(
        requestError?.message || "Bildiriş parametri yenilənmədi."
      );
    } finally {
      setUpdatingOrganizationId("");
    }
  };

  const error = actionError || organizationError;

  return (
    <div className='px-24 py-24'>
      <div className='bg-white rounded-10 px-24 py-24 mb-24'>
        <div className='d-flex flex-wrap align-items-start justify-content-between gap-16 mb-24'>
          <div>
            <h4 className='fw-semibold text-neutral-500 text-20 mb-4'>
              <StaticText text={"Organizations"} />
            </h4>
            <p className='text-14 text-neutral-400 mb-0'>
              <StaticText text={"Create an organization and manage member-completion notifications."} />
            </p>
          </div>
          <AdminRefreshButton
            isLoading={isLoadingOrganizations}
            onClick={() => loadOrganizations(selectedOrganizationId)}
          />
        </div>

        {notice ? (
          <div className='alert alert-success text-14 py-10 mb-16'>{notice}</div>
        ) : null}
        {error ? (
          <div className='alert alert-danger text-14 py-10 mb-16'>{error}</div>
        ) : null}

        <form className='row gy-3 align-items-end' onSubmit={handleCreate}>
          <div className='col-lg-6'>
            <label className='text-14 text-neutral-500 fw-medium mb-8'>
              <StaticText text={"Organization name"} />
            </label>
            <input
              name='name'
              className='common-input rounded-pill'
              value={form.name}
              maxLength='200'
              placeholder='Təşkilatın adı'
              disabled={isSubmitting}
              onChange={handleFormChange}
            />
          </div>
          <div className='col-lg-3'>
            <label className='text-14 text-neutral-500 fw-medium mb-8'>
              <StaticText text={"Type"} />
            </label>
            <select
              name='type'
              className='form-select rounded-pill border-neutral-40 text-14 py-11 px-16'
              value={form.type}
              disabled={isSubmitting}
              onChange={handleFormChange}
            >
              {organizationTypes.map((type) => (
                <option value={type.value} key={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          <div className='col-lg-3'>
            <button
              type='submit'
              className='btn btn-main rounded-pill w-100'
              disabled={isSubmitting}
            >
              {isSubmitting ? <StaticText text={"Creating..."} /> : <StaticText text={"Create organization"} />}
            </button>
          </div>
        </form>
      </div>

      <div className='bg-white rounded-10 px-24 py-24'>
        <div className='row gy-3 align-items-end mb-24'>
          <div className='col-lg-7'>
            <OrganizationSelector
              organizations={organizations}
              selectedOrganizationId={selectedOrganizationId}
              isLoading={isLoadingOrganizations}
              onChange={selectOrganization}
            />
          </div>
          {selectedOrganization ? (
            <div className='col-lg-5'>
              <div className='d-flex flex-wrap justify-content-lg-end gap-8'>
                <Link
                  href={`/admin/members?orgId=${encodeURIComponent(selectedOrganization.id)}`}
                  className='px-16 py-10 border border-neutral-40 rounded-pill text-14 text-neutral-500 bg-white'
                >
                  <StaticText text={"View members"} />
                </Link>
                <Link
                  href={`/admin/invites?orgId=${encodeURIComponent(selectedOrganization.id)}`}
                  className='btn btn-main rounded-pill px-18 py-10'
                >
                  <StaticText text={"Create test invite"} />
                </Link>
              </div>
            </div>
          ) : null}
        </div>

        {isLoadingOrganizations ? (
          <p className='text-14 text-neutral-400 mb-0'><StaticText text={"Loading organizations..."} /></p>
        ) : organizations.length ? (
          <div className='row gy-4'>
            {organizations.map((organization) => {
              const isUpdating = updatingOrganizationId === organization.id;

              return (
                <div className='col-xl-6' key={organization.id}>
                  <div
                    className={`border rounded-10 px-20 py-20 h-100 ${
                      selectedOrganizationId === organization.id
                        ? "border-main-600"
                        : "border-neutral-30"
                    }`}
                  >
                    <div className='d-flex flex-wrap align-items-start justify-content-between gap-12 mb-20'>
                      <div>
                        <span className='text-12 text-main-600 fw-semibold d-block mb-4'>
                          {String(organization.type || "ORGANIZATION").replaceAll("_", " ")}
                        </span>
                        <h5 className='text-18 fw-semibold text-neutral-500 mb-0'>
                          {organization.name}
                        </h5>
                      </div>
                      <AdminStatusBadge status={organization.status || "ACTIVE"} />
                    </div>

                    <div className='d-flex flex-wrap align-items-center justify-content-between gap-12 border-top border-neutral-30 pt-16'>
                      <div>
                        <span className='text-14 fw-medium text-neutral-500 d-block'>
                          <StaticText text={"Completion notifications"} />
                        </span>
                        <span className='text-12 text-neutral-400'>
                          <StaticText text={"Notify when a member completes an invited test."} />
                        </span>
                      </div>
                      <div className='form-check form-switch mb-0'>
                        <input
                          className='form-check-input'
                          type='checkbox'
                          role='switch'
                          aria-label={`Completion notifications for ${organization.name}`}
                          checked={Boolean(organization.notifyOnMemberCompletion)}
                          disabled={isUpdating || organization.status === "ARCHIVED"}
                          onChange={() => toggleCompletionNotification(organization)}
                        />
                      </div>
                    </div>

                    {isUpdating ? (
                      <span className='text-12 text-neutral-400 d-block mt-8'>
                        <StaticText text={"Saving notification setting..."} />
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className='border border-neutral-30 rounded-10 px-20 py-24 text-center'>
            <i className='ph ph-buildings text-32 text-neutral-300 d-block mb-8'></i>
            <p className='text-14 text-neutral-400 mb-0'>
              <StaticText text={"No organizations yet. Use the form above to create the first one."} />
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrganizationManagementPage;
