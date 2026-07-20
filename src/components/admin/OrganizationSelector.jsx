"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchMyOrganizations } from "@/lib/api";
import StaticOption from "@/components/StaticOption";


const STORAGE_KEY = "eduall.selectedOrganizationId";

const readBrowserOrganizationId = () => {
  if (typeof window === "undefined") return "";

  const queryOrganizationId = new URLSearchParams(window.location.search).get("orgId");
  if (queryOrganizationId) return queryOrganizationId;

  try {
    return window.localStorage.getItem(STORAGE_KEY) || "";
  } catch {
    return "";
  }
};

const persistBrowserOrganizationId = (organizationId) => {
  if (typeof window === "undefined") return;

  const nextUrl = new URL(window.location.href);
  if (organizationId) {
    nextUrl.searchParams.set("orgId", organizationId);
  } else {
    nextUrl.searchParams.delete("orgId");
  }

  try {
    if (organizationId) {
      window.localStorage.setItem(STORAGE_KEY, organizationId);
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Query-string persistence still works when storage is unavailable.
  }

  window.history.replaceState(window.history.state, "", `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`);
};

export const useOrganizationSelection = () => {
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState("");
  const selectedOrganizationIdRef = useRef("");
  const [isLoadingOrganizations, setIsLoadingOrganizations] = useState(true);
  const [organizationError, setOrganizationError] = useState("");

  const loadOrganizations = useCallback(async (preferredOrganizationId = "") => {
    setIsLoadingOrganizations(true);
    setOrganizationError("");

    try {
      const response = await fetchMyOrganizations();
      const nextOrganizations = Array.isArray(response) ? response : [];
      setOrganizations(nextOrganizations);

      const requestedOrganizationId =
        preferredOrganizationId ||
        selectedOrganizationIdRef.current ||
        readBrowserOrganizationId();
      const selectedOrganization =
        nextOrganizations.find((organization) => organization.id === requestedOrganizationId) ||
        nextOrganizations[0] ||
        null;
      const nextOrganizationId = selectedOrganization?.id || "";

      selectedOrganizationIdRef.current = nextOrganizationId;
      setSelectedOrganizationId(nextOrganizationId);
      persistBrowserOrganizationId(nextOrganizationId);

      return nextOrganizations;
    } catch (requestError) {
      setOrganizations([]);
      selectedOrganizationIdRef.current = "";
      setSelectedOrganizationId("");
      setOrganizationError(requestError?.message || "Organizations could not be loaded.");
      return [];
    } finally {
      setIsLoadingOrganizations(false);
    }
  }, []);

  useEffect(() => {
    loadOrganizations();
  }, [loadOrganizations]);

  const selectOrganization = useCallback((organizationId) => {
    selectedOrganizationIdRef.current = organizationId;
    setSelectedOrganizationId(organizationId);
    persistBrowserOrganizationId(organizationId);
  }, []);

  const selectedOrganization =
    organizations.find((organization) => organization.id === selectedOrganizationId) || null;

  return {
    organizations,
    selectedOrganization,
    selectedOrganizationId,
    selectOrganization,
    loadOrganizations,
    isLoadingOrganizations,
    organizationError,
  };
};

const OrganizationSelector = ({
  organizations,
  selectedOrganizationId,
  onChange,
  isLoading = false,
  disabled = false,
  label = "Organization",
}) => (
  <div>
    {label ? <label className='text-14 text-neutral-500 fw-medium mb-8'>{label}</label> : null}
    <select
      className='form-select rounded-pill border-neutral-40 text-14 py-11 px-16'
      value={selectedOrganizationId}
      disabled={disabled || isLoading || !organizations.length}
      onChange={(event) => onChange?.(event.target.value)}
    >
      {!organizations.length ? (
        <StaticOption
          value=''
          text={isLoading ? "Loading organizations..." : "No organizations"}
        />
      ) : null}
      {organizations.map((organization) => (
        <option value={organization.id} key={organization.id}>
          {organization.name} ({String(organization.type || "organization").replaceAll("_", " ")})
        </option>
      ))}
    </select>
  </div>
);

export default OrganizationSelector;
