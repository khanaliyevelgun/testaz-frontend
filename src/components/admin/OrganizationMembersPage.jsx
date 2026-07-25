"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import AdminRefreshButton from "@/components/admin/AdminRefreshButton";
import AdminStatusBadge from "@/components/admin/AdminStatusBadge";
import OrganizationSelector, {
  useOrganizationSelection,
} from "@/components/admin/OrganizationSelector";
import { fetchOrganizationMembers } from "@/lib/api";
import { formatDateTime as formatDate } from "@/lib/format";
import StaticText from "@/components/StaticText";
import AdminTableSkeleton from "@/components/admin/AdminTableSkeleton";


const emptyMeta = {
  page: 1,
  perPage: 10,
  total: 0,
  totalPages: 1,
  hasNext: false,
};

const OrganizationMembersPage = () => {
  const {
    organizations,
    selectedOrganization,
    selectedOrganizationId,
    selectOrganization,
    loadOrganizations,
    isLoadingOrganizations,
    organizationError,
  } = useOrganizationSelection();
  const [members, setMembers] = useState([]);
  const [meta, setMeta] = useState(emptyMeta);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [memberError, setMemberError] = useState("");

  const loadMembers = useCallback(
    async (page = 1, organizationId = selectedOrganizationId) => {
      if (!organizationId) {
        setMembers([]);
        setMeta(emptyMeta);
        return;
      }

      setIsLoadingMembers(true);
      setMemberError("");

      try {
        const response = await fetchOrganizationMembers(organizationId, {
          page,
          perPage: 10,
        });
        setMembers(response.data || []);
        setMeta(response.meta || { ...emptyMeta, page });
      } catch (requestError) {
        setMembers([]);
        setMeta({ ...emptyMeta, page });
        setMemberError(requestError?.message || "Təşkilat üzvləri yüklənmədi.");
      } finally {
        setIsLoadingMembers(false);
      }
    },
    [selectedOrganizationId]
  );

  useEffect(() => {
    if (selectedOrganizationId) {
      loadMembers(1, selectedOrganizationId);
    } else {
      setMembers([]);
      setMeta(emptyMeta);
    }
  }, [loadMembers, selectedOrganizationId]);

  const handleRefresh = () => {
    if (selectedOrganizationId) {
      loadMembers(meta.page, selectedOrganizationId);
    } else {
      loadOrganizations();
    }
  };

  const error = memberError || organizationError;
  const isLoading = isLoadingOrganizations || isLoadingMembers;

  return (
    <div className='px-24 py-24'>
      <div className='bg-white rounded-10 px-24 py-24'>
        <div className='d-flex flex-wrap align-items-start justify-content-between gap-16 mb-24'>
          <div>
            <h4 className='fw-semibold text-neutral-500 text-20 mb-4'>
              <StaticText text={"Organization members"} />
            </h4>
            <p className='text-14 text-neutral-400 mb-0'>
              <StaticText text={"Review learners who joined through organization test invitations."} />
            </p>
          </div>
          <div className='d-flex flex-wrap gap-8'>
            {selectedOrganizationId ? (
              <Link
                href={`/admin/invites?orgId=${encodeURIComponent(selectedOrganizationId)}`}
                className='btn btn-main rounded-pill px-18 py-10'
              >
                <StaticText text={"Create invite"} />
              </Link>
            ) : null}
            <AdminRefreshButton isLoading={isLoading} onClick={handleRefresh} />
          </div>
        </div>

        <div className='row gy-3 align-items-end mb-24'>
          <div className='col-lg-7'>
            <OrganizationSelector
              organizations={organizations}
              selectedOrganizationId={selectedOrganizationId}
              isLoading={isLoadingOrganizations}
              onChange={selectOrganization}
            />
          </div>
          <div className='col-lg-5'>
            <div className='border border-neutral-30 rounded-10 px-16 py-12'>
              <span className='text-12 text-neutral-400 d-block mb-2'>
                <StaticText text={"Selected organization"} />
              </span>
              <span className='text-14 fw-medium text-neutral-500'>
                {selectedOrganization?.name || "-"}
              </span>
            </div>
          </div>
        </div>

        {error ? (
          <div className='alert alert-danger text-14 py-10 mb-16'>{error}</div>
        ) : null}

        {!isLoadingOrganizations && !organizations.length ? (
          <div className='border border-neutral-30 rounded-10 px-20 py-24 text-center'>
            <i className='ph ph-buildings text-32 text-neutral-300 d-block mb-8'></i>
            <p className='text-14 text-neutral-400 mb-12'>
              <StaticText text={"Create an organization before viewing members."} />
            </p>
            <Link href='/admin/organizations' className='btn btn-main rounded-pill px-20'>
              <StaticText text={"Go to organizations"} />
            </Link>
          </div>
        ) : (
          <>
            <div className='table-responsive admin-users-table'>
              <table className='table mb-0'>
                <thead>
                  <tr>
                    <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>
                      <StaticText text={"Student ID"} />
                    </th>
                    <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>
                      <StaticText text={"Grade"} />
                    </th>
                    <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>
                      <StaticText text={"Status"} />
                    </th>
                    <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>
                      <StaticText text={"Joined"} />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingMembers ? (
                    <AdminTableSkeleton columns={4} />
                  ) : members.length ? (
                    members.map((member) => (
                      <tr key={member.studentId}>
                        <td className='py-16 px-20 text-14 text-neutral-500'>
                          {member.studentName || <span className='font-monospace'>{member.studentId}</span>}
                        </td>
                        <td className='py-16 px-20 text-14 text-neutral-500'>
                          {member.gradeId || "-"}
                        </td>
                        <td className='py-16 px-20'>
                          <AdminStatusBadge status={member.status || "ACTIVE"} />
                        </td>
                        <td className='py-16 px-20 text-14 text-neutral-500'>
                          {formatDate(member.joinedAt)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className='py-20 px-20 text-neutral-400' colSpan='4'>
                        {selectedOrganizationId
                          ? <StaticText text={"No members have joined this organization yet."} />
                          : <StaticText text={"Select an organization to view its members."} />}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className='d-flex flex-wrap align-items-center justify-content-between gap-12 mt-24'>
              <span className='text-13 text-neutral-400'>
                {meta.total} {meta.total === 1 ? <StaticText text={"member"} /> : <StaticText text={"members"} />}
              </span>
              <div className='d-flex align-items-center gap-8'>
                <button
                  type='button'
                  className='px-14 py-8 border border-neutral-40 rounded-8 text-14 text-neutral-500 bg-white'
                  disabled={isLoadingMembers || meta.page <= 1}
                  onClick={() => loadMembers(Math.max(meta.page - 1, 1))}
                >
                  <StaticText text={"Previous"} />
                </button>
                <span className='text-14 text-neutral-400'>
                  {meta.page} / {Math.max(meta.totalPages, 1)}
                </span>
                <button
                  type='button'
                  className='px-14 py-8 border border-neutral-40 rounded-8 text-14 text-neutral-500 bg-white'
                  disabled={
                    isLoadingMembers ||
                    !selectedOrganizationId ||
                    meta.page >= Math.max(meta.totalPages, 1)
                  }
                  onClick={() =>
                    loadMembers(Math.min(meta.page + 1, Math.max(meta.totalPages, 1)))
                  }
                >
                  <StaticText text={"Next"} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default OrganizationMembersPage;
