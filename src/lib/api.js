import {
  clearAuthState,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from "@/stores/authStore";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/+$/, "");
const API_PREFIX = "/api/v1";

let refreshPromise = null;

const isAuthEndpoint = (url) =>
  url.endsWith(`${API_PREFIX}/auth/login`) ||
  url.endsWith(`${API_PREFIX}/auth/register`) ||
  url.endsWith(`${API_PREFIX}/auth/password/forgot`) ||
  url.endsWith(`${API_PREFIX}/auth/password/reset`) ||
  url.endsWith(`${API_PREFIX}/auth/refresh`);

const buildUrl = (path) => {
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedPath = path.startsWith(API_PREFIX) ? path : `${API_PREFIX}${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

const unwrapApiResponse = (data) => {
  if (data && typeof data === "object" && Object.prototype.hasOwnProperty.call(data, "data")) {
    return data.data;
  }

  return data;
};

const withMessage = (response) => {
  const data = unwrapApiResponse(response);
  if (data && typeof data === "object" && !Array.isArray(data)) {
    return { ...data, message: response?.message };
  }

  return data;
};

const normalizeRole = (role) => {
  const normalizedRole = String(role || "").toLowerCase();
  if (normalizedRole === "student") return "child";
  return normalizedRole;
};

const normalizeUser = (user) => {
  if (!user) return null;
  const roles = Array.isArray(user.roles)
    ? user.roles.map(normalizeRole)
    : user.role
      ? [normalizeRole(user.role)]
      : [];

  return {
    ...user,
    id: user.id || user.userId,
    role: roles[0],
    roles,
    name: user.fullName || user.name || user.email || user.login || "Istifadeci",
  };
};

const emptyPage = (page = 1, perPage = 10) => ({
  data: [],
  meta: { page, perPage, total: 0, totalPages: 1 },
});

const normalizePage = (pageResponse, page = 1, perPage = 10) => {
  const content = pageResponse?.content || pageResponse?.data || [];

  return {
    data: Array.isArray(content) ? content : [],
    meta: {
      page: (pageResponse?.page ?? page - 1) + 1,
      perPage: pageResponse?.size || perPage,
      total: pageResponse?.totalElements || 0,
      totalPages: pageResponse?.totalPages || 1,
      hasNext: Boolean(pageResponse?.hasNext),
    },
  };
};

const parseResponse = async (response) => {
  const contentType = response.headers.get("content-type") || "";

  if (response.status === 204) {
    return null;
  }

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
};

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export async function refreshAccessToken() {
  if (!refreshPromise) {
    const refreshToken = getRefreshToken();

    if (!refreshToken) {
      clearAuthState();
      throw new ApiError("Refresh token is missing", 401, null);
    }

    refreshPromise = fetch(buildUrl("/auth/refresh"), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    })
      .then(async (response) => {
        const responseData = await parseResponse(response);
        const data = unwrapApiResponse(responseData);

        if (!response.ok) {
          throw new ApiError("Unauthorized", response.status, data);
        }

        const accessToken = data?.accessToken;
        if (!accessToken) {
          throw new ApiError("Refresh response did not include an access token", response.status, data);
        }

        setTokens({
          accessToken,
          refreshToken: data?.refreshToken || refreshToken,
        });
        return accessToken;
      })
      .catch((error) => {
        clearAuthState();
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

export async function apiFetch(path, options = {}) {
  const url = buildUrl(path);
  const { _retry, ...fetchOptions } = options;
  const headers = new Headers(fetchOptions.headers || {});
  const accessToken = getAccessToken();
  const shouldAttachToken = !isAuthEndpoint(url) && accessToken;
  const retry = _retry === true;

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  if (fetchOptions.body && !(fetchOptions.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (shouldAttachToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
    credentials: "include",
  });

  if (response.status === 401 && !retry && !isAuthEndpoint(url)) {
    try {
      const newAccessToken = await refreshAccessToken();
      const retryHeaders = new Headers(headers);
      retryHeaders.set("Authorization", `Bearer ${newAccessToken}`);

      return apiFetch(path, {
        ...fetchOptions,
        headers: retryHeaders,
        _retry: true,
      });
    } catch (error) {
      clearAuthState();
      if (typeof window !== "undefined") {
        window.location.assign("/sign-in");
      }
      throw error;
    }
  }

  const data = await parseResponse(response);

  if (!response.ok) {
    const message = data?.message || "Request failed";
    throw new ApiError(message, response.status, data);
  }

  return data;
}

const toQueryString = (params) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  });

  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
};

export const login = (credentials) =>
  apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      login: credentials.login || credentials.email,
      password: credentials.password,
    }),
  }).then((response) => {
    const tokens = withMessage(response);
    setTokens(tokens);
    return tokens;
  });

export const register = (payload) =>
  apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      fullName: payload.fullName || payload.name,
      email: payload.email,
      phone: payload.phone,
      password: payload.password,
      role: payload.role || "STUDENT",
    }),
  }).then(withMessage);

export const logout = () =>
  apiFetch("/auth/logout", {
    method: "POST",
    body: JSON.stringify({ refreshToken: getRefreshToken() }),
  });

export const forgotPassword = (payload) =>
  apiFetch("/auth/password/forgot", {
    method: "POST",
    body: JSON.stringify({ login: payload.login || payload.email }),
  });

export const resetPassword = (payload) =>
  apiFetch("/auth/password/reset", {
    method: "POST",
    body: JSON.stringify({
      login: payload.login || payload.email,
      code: payload.code || payload.token,
      newPassword: payload.newPassword || payload.password,
    }),
  });

export const fetchProfile = () => apiFetch("/auth/me").then((response) => normalizeUser(unwrapApiResponse(response)));

const normalizeNotification = (notification) => ({
  ...notification,
  message: notification.body || notification.message || "",
  isRead: Boolean(notification.readAt || notification.isRead),
  href: notification.deepLink || "/admin/notifications",
});

const fetchUnreadNotificationCount = () =>
  apiFetch("/notifications/unread-count").then((response) => Number(unwrapApiResponse(response) || 0));

export const fetchNotifications = ({ page = 1, perPage = 10, unreadOnly = false } = {}) =>
  Promise.all([
    apiFetch(`/notifications?page=${Math.max(page - 1, 0)}&size=${perPage}`),
    fetchUnreadNotificationCount(),
  ]).then(([response, unreadCount]) => {
    const pageData = normalizePage(unwrapApiResponse(response), page, perPage);
    const notifications = pageData.data.map(normalizeNotification);
    const filteredNotifications = unreadOnly
      ? notifications.filter((notification) => !notification.isRead)
      : notifications;

    return {
      data: filteredNotifications,
      meta: {
        ...pageData.meta,
        unreadCount,
      },
    };
  });

export const markNotificationsRead = (ids = []) =>
  Promise.all(
    ids.map((id) =>
      apiFetch(`/notifications/${id}/read`, {
        method: "POST",
      })
    )
  ).then(() => ({ ids }));

const normalizeUserRow = (user) => ({
  ...user,
  id: user.id || user.userId,
  name: user.fullName || user.name || user.email || user.login || "Istifadeci",
  role: normalizeRole(user.role || user.roles?.[0]),
  roles: Array.isArray(user.roles) ? user.roles.map(normalizeRole) : undefined,
  status: user.status,
});

const normalizeAdminSubject = (subject) => ({
  ...subject,
  name: subject?.nameAz || subject?.nameEn || subject?.code,
  status: subject?.active ? "ACTIVE" : "INACTIVE",
  topicCount: subject?.topicCount || 0,
});

const normalizeAdminTopic = (topic) => ({
  ...topic,
  name: topic?.nameAz || topic?.nameEn || topic?.code,
  status: topic?.active ? "ACTIVE" : "INACTIVE",
  questionCount: topic?.questionCount || 0,
});

export const fetchUsers = ({ page = 1, perPage = 10, search = "", role = "", status = "" } = {}) =>
  apiFetch(
    `/admin/users${toQueryString({
      page: Math.max(page - 1, 0),
      size: perPage,
      search,
      role: role ? role.toUpperCase() : "",
      status,
    })}`
  ).then((response) => {
    const pageData = normalizePage(unwrapApiResponse(response), page, perPage);
    return {
      ...pageData,
      data: pageData.data.map(normalizeUserRow),
    };
  });

export const fetchUser = (id) => apiFetch(`/admin/users/${id}`).then((response) => normalizeUserRow(unwrapApiResponse(response)));

export const createUser = (payload) =>
  apiFetch("/admin/users", {
    method: "POST",
    body: JSON.stringify(payload),
  }).then((response) => normalizeUserRow(unwrapApiResponse(response)));

export const updateUser = (id, payload) =>
  apiFetch(`/admin/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  }).then((response) => normalizeUserRow(unwrapApiResponse(response)));

export const deleteUser = (id) =>
  apiFetch(`/admin/users/${id}/delete`, { method: "POST" }).then((response) => normalizeUserRow(unwrapApiResponse(response)));

export const restoreUser = (id) =>
  apiFetch(`/admin/users/${id}/restore`, { method: "POST" }).then((response) => normalizeUserRow(unwrapApiResponse(response)));

export const fetchSubjects = ({ page = 1, perPage = 10, search = "", active = "" } = {}) =>
  apiFetch(
    `/admin/subjects${toQueryString({
      page: Math.max(page - 1, 0),
      size: perPage,
      search,
      active,
    })}`
  ).then((response) => {
    const pageData = normalizePage(unwrapApiResponse(response), page, perPage);
    return {
      ...pageData,
      data: pageData.data.map(normalizeAdminSubject),
    };
  });

export const fetchSubject = (id) =>
  apiFetch(`/admin/subjects/${id}`).then((response) => normalizeAdminSubject(unwrapApiResponse(response)));

export const createSubject = (payload) =>
  apiFetch("/admin/subjects", {
    method: "POST",
    body: JSON.stringify(payload),
  }).then((response) => normalizeAdminSubject(unwrapApiResponse(response)));

export const updateSubject = (id, payload) =>
  apiFetch(`/admin/subjects/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  }).then((response) => normalizeAdminSubject(unwrapApiResponse(response)));

export const activateSubject = (id) =>
  apiFetch(`/admin/subjects/${id}/activate`, { method: "POST" }).then((response) => unwrapApiResponse(response));

export const deactivateSubject = (id) =>
  apiFetch(`/admin/subjects/${id}/deactivate`, { method: "POST" }).then((response) => unwrapApiResponse(response));

export const fetchTopics = (subjectId, { page = 1, perPage = 10, search = "", gradeId = "", active = "" } = {}) =>
  apiFetch(
    `/admin/topics${toQueryString({
      page: Math.max(page - 1, 0),
      size: perPage,
      search,
      subjectId,
      gradeId,
      active,
    })}`
  ).then((response) => {
    const pageData = normalizePage(unwrapApiResponse(response), page, perPage);
    return {
      ...pageData,
      data: pageData.data.map(normalizeAdminTopic),
    };
  });

export const fetchTopic = (id) =>
  apiFetch(`/admin/topics/${id}`).then((response) => normalizeAdminTopic(unwrapApiResponse(response)));

export const createTopic = (payload) =>
  apiFetch("/admin/topics", {
    method: "POST",
    body: JSON.stringify(payload),
  }).then((response) => normalizeAdminTopic(unwrapApiResponse(response)));

export const updateTopic = (id, payload) =>
  apiFetch(`/admin/topics/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  }).then((response) => normalizeAdminTopic(unwrapApiResponse(response)));

export const activateTopic = (id) =>
  apiFetch(`/admin/topics/${id}/activate`, { method: "POST" }).then((response) => unwrapApiResponse(response));

export const deactivateTopic = (id) =>
  apiFetch(`/admin/topics/${id}/deactivate`, { method: "POST" }).then((response) => unwrapApiResponse(response));

export const fetchGrades = () => apiFetch("/grades").then((response) => unwrapApiResponse(response) || []);

export const fetchExamDefinitions = () =>
  apiFetch("/exam-definitions").then((response) => unwrapApiResponse(response) || []);

export const fetchExamDefinition = (code) =>
  apiFetch(`/exam-definitions/${code}`).then((response) => unwrapApiResponse(response));

export const fetchStudentProfile = () => apiFetch("/students/me").then((response) => unwrapApiResponse(response));

export const updateStudentProfile = (payload) =>
  apiFetch("/students/me", {
    method: "PUT",
    body: JSON.stringify(payload),
  }).then((response) => unwrapApiResponse(response));

export const createParentLinkCode = () =>
  apiFetch("/students/me/link-codes", {
    method: "POST",
  }).then((response) => unwrapApiResponse(response));

export const fetchParentProfile = () => apiFetch("/parents/me").then((response) => unwrapApiResponse(response));

export const updateParentProfile = (payload) =>
  apiFetch("/parents/me", {
    method: "PUT",
    body: JSON.stringify(payload),
  }).then((response) => unwrapApiResponse(response));

export const linkChild = (code) =>
  apiFetch("/parents/me/links", {
    method: "POST",
    body: JSON.stringify({ code }),
  }).then((response) => unwrapApiResponse(response));

export const unlinkChild = (studentId) =>
  apiFetch(`/parents/me/links/${studentId}`, {
    method: "DELETE",
  });

export const fetchLinkedChildren = () =>
  apiFetch("/parents/me/children").then((response) => unwrapApiResponse(response) || []);

export const fetchChildResults = (studentId, { page = 1, perPage = 10 } = {}) =>
  apiFetch(`/parents/me/children/${studentId}/results${toQueryString({ page: Math.max(page - 1, 0), size: perPage })}`)
    .then((response) => normalizePage(unwrapApiResponse(response), page, perPage));

export const fetchChildSessionResult = (studentId, sessionId) =>
  apiFetch(`/parents/me/children/${studentId}/sessions/${sessionId}/result`).then((response) =>
    unwrapApiResponse(response)
  );

export const createOrganization = (payload) =>
  apiFetch("/organizations", {
    method: "POST",
    body: JSON.stringify(payload),
  }).then((response) => unwrapApiResponse(response));

export const fetchMyOrganizations = () =>
  apiFetch("/organizations/me").then((response) => unwrapApiResponse(response) || []);

export const createOrganizationInvite = (orgId, payload) =>
  apiFetch(`/organizations/${orgId}/invites`, {
    method: "POST",
    body: JSON.stringify(payload),
  }).then((response) => unwrapApiResponse(response));

export const fetchOrganizationMembers = (orgId, { page = 1, perPage = 10 } = {}) =>
  apiFetch(`/organizations/${orgId}/members${toQueryString({ page: Math.max(page - 1, 0), size: perPage })}`)
    .then((response) => normalizePage(unwrapApiResponse(response), page, perPage));

export const fetchOrganizationTestResults = (orgId, testId, { page = 1, perPage = 10 } = {}) =>
  apiFetch(`/organizations/${orgId}/tests/${testId}/results${toQueryString({ page: Math.max(page - 1, 0), size: perPage })}`)
    .then((response) => normalizePage(unwrapApiResponse(response), page, perPage));

export const redeemOrganizationInvite = (code) =>
  apiFetch(`/organizations/invites/${code}/redeem`, {
    method: "POST",
  }).then((response) => unwrapApiResponse(response));

export const startSession = (payload) =>
  apiFetch("/sessions", {
    method: "POST",
    body: JSON.stringify(payload),
  }).then((response) => unwrapApiResponse(response));

export const fetchSession = (id) => apiFetch(`/sessions/${id}`).then((response) => unwrapApiResponse(response));

export const saveSessionAnswer = (sessionId, sessionQuestionId, payload) =>
  apiFetch(`/sessions/${sessionId}/questions/${sessionQuestionId}/answer`, {
    method: "PUT",
    body: JSON.stringify(payload),
  }).then((response) => unwrapApiResponse(response));

export const submitSession = (id) =>
  apiFetch(`/sessions/${id}/submit`, {
    method: "POST",
  }).then((response) => unwrapApiResponse(response));

export const fetchSessionResult = (id) =>
  apiFetch(`/sessions/${id}/result`).then((response) => unwrapApiResponse(response));

export const fetchResults = ({ page = 1, perPage = 10 } = {}) =>
  apiFetch(`/results${toQueryString({ page: Math.max(page - 1, 0), size: perPage })}`).then((response) =>
    normalizePage(unwrapApiResponse(response), page, perPage)
  );

export const fetchNotificationPreferences = () =>
  apiFetch("/notifications/preferences").then((response) => unwrapApiResponse(response));

export const updateNotificationPreferences = (payload) =>
  apiFetch("/notifications/preferences", {
    method: "PUT",
    body: JSON.stringify(payload),
  }).then((response) => unwrapApiResponse(response));

export const fetchAdminQuestions = ({
  page = 1,
  perPage = 10,
  search = "",
  subjectCode = "",
  topicCode = "",
  gradeId = "",
  difficulty = "",
  type = "",
  status = "",
} = {}) =>
  apiFetch(
    `/admin/questions${toQueryString({
      page: Math.max(page - 1, 0),
      size: perPage,
      search,
      subjectCode,
      topicCode,
      gradeId,
      difficulty,
      type,
      status,
    })}`
  ).then((response) => normalizePage(unwrapApiResponse(response), page, perPage));

export const fetchAdminQuestion = (id) =>
  apiFetch(`/admin/questions/${id}`).then((response) => unwrapApiResponse(response));

export const createAdminQuestion = (payload) =>
  apiFetch("/admin/questions", {
    method: "POST",
    body: JSON.stringify(payload),
  }).then((response) => unwrapApiResponse(response));

export const updateAdminQuestion = (id, payload) =>
  apiFetch(`/admin/questions/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  }).then((response) => unwrapApiResponse(response));

export const uploadAdminMedia = (file) => {
  const formData = new FormData();
  formData.append("file", file);

  return apiFetch("/admin/uploads", {
    method: "POST",
    body: formData,
  }).then((response) => unwrapApiResponse(response));
};

export const getApiAssetUrl = (path = "") => {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

export const approveAllAdminQuestions = () =>
  apiFetch("/admin/questions/approve-all", {
    method: "POST",
  }).then((response) => Number(unwrapApiResponse(response)?.approvedCount || 0));

export const approveAdminQuestion = (id) =>
  apiFetch(`/admin/questions/${id}/approve`, {
    method: "POST",
  });

export const rejectAdminQuestion = (id) =>
  apiFetch(`/admin/questions/${id}/reject`, {
    method: "POST",
  });

export const archiveAdminQuestion = (id) =>
  apiFetch(`/admin/questions/${id}/archive`, {
    method: "POST",
  });

export const fetchAdminReports = ({ page = 1, perPage = 10, status = "" } = {}) =>
  apiFetch(
    `/admin/reports${toQueryString({
      page: Math.max(page - 1, 0),
      size: perPage,
      status,
    })}`
  ).then((response) => normalizePage(unwrapApiResponse(response), page, perPage));

export const resolveAdminReport = (id, payload = {}) =>
  apiFetch(`/admin/reports/${id}/resolve`, {
    method: "POST",
    body: JSON.stringify({
      note: payload.note || "",
      archiveQuestion: Boolean(payload.archiveQuestion),
    }),
  }).then((response) => unwrapApiResponse(response));

export const dismissAdminReport = (id, payload = {}) =>
  apiFetch(`/admin/reports/${id}/dismiss`, {
    method: "POST",
    body: JSON.stringify({ note: payload.note || "" }),
  }).then((response) => unwrapApiResponse(response));

export const fetchAdminAiJobs = ({ page = 1, perPage = 10 } = {}) =>
  apiFetch(`/admin/ai/jobs${toQueryString({ page: Math.max(page - 1, 0), size: perPage })}`).then((response) =>
    normalizePage(unwrapApiResponse(response), page, perPage)
  );

export const generateAdminAiQuestions = (payload) =>
  apiFetch("/admin/ai/generate", {
    method: "POST",
    body: JSON.stringify({
      subjectId: Number(payload.subjectId),
      gradeId: payload.gradeId ? Number(payload.gradeId) : undefined,
      topicId: payload.topicId ? Number(payload.topicId) : undefined,
      difficulty: payload.difficulty,
      questionType: payload.questionType,
      count: payload.count ? Number(payload.count) : undefined,
    }),
  }).then((response) => unwrapApiResponse(response));

export const fetchSubscriptionPlans = () =>
  apiFetch("/subscriptions/plans").then((response) => unwrapApiResponse(response) || []);

export const fetchMySubscriptions = () =>
  apiFetch("/subscriptions/me").then((response) => unwrapApiResponse(response) || []);

export const fetchSubscriptionEntitlement = () =>
  apiFetch("/subscriptions/me/entitlement").then((response) => unwrapApiResponse(response));

export const startPaymentCheckout = (planCode) =>
  apiFetch("/payments/checkout", {
    method: "POST",
    body: JSON.stringify({ planCode }),
  }).then((response) => unwrapApiResponse(response));

export const fetchAdminAuditLogs = ({
  page = 1,
  perPage = 10,
  actorUserId = "",
  action = "",
  targetType = "",
  outcome = "",
} = {}) =>
  apiFetch(
    `/admin/audit${toQueryString({
      page: Math.max(page - 1, 0),
      size: perPage,
      actorUserId,
      action,
      targetType,
      outcome,
    })}`
  ).then((response) => normalizePage(unwrapApiResponse(response), page, perPage));
