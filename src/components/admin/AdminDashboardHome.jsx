"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import AdminRefreshButton from "@/components/admin/AdminRefreshButton";
import AdminStatusBadge from "@/components/admin/AdminStatusBadge";
import DashboardCharts from "@/components/admin/DashboardCharts";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchAdminDashboard,
  fetchMyOrganizations,
  fetchParentDashboard,
  fetchResults,
  fetchResultTrends,
} from "@/lib/api";
import { getPrimaryRole } from "@/lib/authRoles";

const roleLabels = {
  admin: "Administration overview",
  parent: "Family learning overview",
  child: "My learning overview",
  organization: "Organization overview",
};

const roleDescriptions = {
  admin: "Live account, content, session and billing totals.",
  parent: "Linked children, invitations and recent learning performance.",
  child: "Recent results and subject performance from your completed tests.",
  organization: "Organizations you own and their current status.",
};

const emptyDashboard = {
  stats: [],
  rows: [],
  tableTitle: "",
  columns: [],
  quickLinks: [],
};

const numberValue = (value) => new Intl.NumberFormat("az-AZ").format(Number(value || 0));

const percentageValue = (value) =>
  value == null || Number.isNaN(Number(value)) ? "-" : `${Math.round(Number(value))}%`;

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("az-AZ", { dateStyle: "medium" }).format(date);
};

const sumObjectValues = (value) =>
  Object.values(value || {}).reduce((total, item) => total + Number(item || 0), 0);

const getChildDashboard = (resultsResponse, trendsResponse) => {
  const results = Array.isArray(resultsResponse?.data) ? resultsResponse.data : [];
  const trends = Array.isArray(trendsResponse) ? trendsResponse : [];
  const scoredResults = results.filter((result) => result.percentage != null);
  const recentAverage = scoredResults.length
    ? scoredResults.reduce((total, result) => total + Number(result.percentage || 0), 0) / scoredResults.length
    : null;
  const bestRecent = scoredResults.length
    ? Math.max(...scoredResults.map((result) => Number(result.percentage || 0)))
    : null;
  const weakestSubject = [...trends]
    .filter((trend) => trend.accuracy != null)
    .sort((left, right) => Number(left.accuracy) - Number(right.accuracy))[0];
  const recentTrend = [...scoredResults]
    .reverse()
    .map((result, index) => ({ label: `#${index + 1}`, value: Number(result.percentage) }));
  const subjectChart = trends
    .filter((trend) => trend.accuracy != null)
    .sort((left, right) => Number(right.accuracy) - Number(left.accuracy))
    .slice(0, 8)
    .map((trend) => ({ label: trend.subjectName || `#${trend.subjectId}`, value: Number(trend.accuracy) }));

  return {
    stats: [
      {
        label: "Completed tests",
        value: numberValue(resultsResponse?.meta?.total ?? results.length),
        icon: "ph ph-check-square-offset",
        tone: "bg-main-600",
        href: "/admin/quiz-attempts",
      },
      {
        label: "Recent average",
        value: percentageValue(recentAverage),
        icon: "ph ph-chart-line-up",
        tone: "bg-success-600",
        href: "/admin/quiz-attempts",
      },
      {
        label: "Best recent score",
        value: percentageValue(bestRecent),
        icon: "ph ph-medal",
        tone: "bg-warning-600",
        href: "/admin/quiz-attempts",
      },
      {
        label: "Focus subject",
        value: weakestSubject?.subjectName || "-",
        icon: "ph ph-target",
        tone: "bg-danger-600",
        href: "/admin/assignments",
      },
    ],
    rows: trends.slice(0, 6),
    tableTitle: "Subject trends",
    columns: [
      { label: "Subject", render: (row) => row.subjectName || "-" },
      { label: "Accuracy", render: (row) => percentageValue(row.accuracy) },
      { label: "Tests", render: (row) => numberValue(row.testsCount) },
      {
        label: "Trend",
        render: (row) => <AdminStatusBadge status={row.trend} />,
      },
    ],
    emptyText: "Complete a test to see subject trends here.",
    charts: [
      {
        type: "line",
        title: "Score progress",
        description: "Your latest completed tests, from oldest to newest.",
        data: recentTrend,
        unit: "%",
        icon: "ph ph-chart-line-up",
      },
      {
        title: "Subject performance",
        description: "Accuracy by subject based on all completed tests.",
        data: subjectChart,
        unit: "%",
        icon: "ph ph-target",
      },
    ],
    quickLinks: [
      { label: "Assignments", href: "/admin/assignments", icon: "ph ph-clipboard-text" },
      { label: "Results", href: "/admin/quiz-attempts", icon: "ph ph-chart-bar" },
      { label: "Subscription", href: "/admin/subscriptions", icon: "ph ph-credit-card" },
      { label: "Profile", href: "/admin/profile", icon: "ph ph-user-circle" },
    ],
    secondaryRows: results.slice(0, 5),
  };
};

const getParentDashboard = (dashboard = {}) => {
  const learners = Array.isArray(dashboard.learners) ? dashboard.learners : [];
  const averages = learners
    .map((learner) => Number(learner.averagePercentage))
    .filter((value) => Number.isFinite(value));
  const familyAverage = averages.length
    ? averages.reduce((total, value) => total + value, 0) / averages.length
    : null;
  const childChart = learners
    .filter((learner) => learner.averagePercentage != null)
    .map((learner) => ({ label: learner.name || learner.learnerId || "Child", value: Number(learner.averagePercentage) }));
  const activityChart = learners
    .filter((learner) => learner.recentResultCount != null)
    .map((learner) => ({ label: learner.name || learner.learnerId || "Child", value: Number(learner.recentResultCount) }));

  return {
    stats: [
      {
        label: "Linked children",
        value: numberValue(dashboard.linkedLearnerCount ?? learners.length),
        icon: "ph ph-student",
        tone: "bg-main-600",
        href: "/admin/children",
      },
      {
        label: "Pending invitations",
        value: numberValue(dashboard.pendingInvitationCount),
        icon: "ph ph-envelope-simple",
        tone: "bg-warning-600",
        href: "/admin/children",
      },
      {
        label: "Family average",
        value: percentageValue(familyAverage),
        icon: "ph ph-chart-line-up",
        tone: "bg-success-600",
        href: "/admin/progress",
      },
      {
        label: "Recent results",
        value: numberValue(
          learners.reduce((total, learner) => total + Number(learner.recentResultCount || 0), 0)
        ),
        icon: "ph ph-exam",
        tone: "bg-main-600",
        href: "/admin/progress",
      },
    ],
    rows: learners,
    tableTitle: "Children performance",
    columns: [
      { label: "Child", render: (row) => row.name || row.learnerId || "-" },
      { label: "Average", render: (row) => percentageValue(row.averagePercentage) },
      {
        label: "Latest result",
        render: (row) => percentageValue(row.latestResult?.percentage),
      },
      {
        label: "Last activity",
        render: (row) => formatDate(row.latestResult?.scoredAt),
      },
    ],
    emptyText: "No linked children yet.",
    charts: [
      {
        title: "Children average",
        description: "Compare the latest average performance of linked children.",
        data: childChart,
        unit: "%",
        icon: "ph ph-users-three",
      },
      {
        title: "Learning activity",
        description: "Completed results reported for each linked child.",
        data: activityChart,
        icon: "ph ph-chart-line-up",
      },
    ],
    quickLinks: [
      { label: "Children", href: "/admin/children", icon: "ph ph-student" },
      { label: "Progress", href: "/admin/progress", icon: "ph ph-chart-line-up" },
      { label: "Exams", href: "/admin/exams", icon: "ph ph-clipboard-text" },
      { label: "Subscriptions", href: "/admin/subscriptions", icon: "ph ph-credit-card" },
    ],
  };
};

const getAdminDashboard = (dashboard = {}) => ({
  stats: [
    {
      label: "Total users",
      value: numberValue(sumObjectValues(dashboard.usersByStatus)),
      icon: "ph ph-users-three",
      tone: "bg-main-600",
      href: "/admin/users",
    },
    {
      label: "Pending questions",
      value: numberValue(dashboard.pendingQuestionReview),
      icon: "ph ph-seal-question",
      tone: "bg-warning-600",
      href: "/admin/questions",
    },
    {
      label: "All sessions",
      value: numberValue(dashboard.totalSessions),
      icon: "ph ph-play-circle",
      tone: "bg-success-600",
      href: "/admin/quiz-attempts",
    },
    {
      label: "Sessions this month",
      value: numberValue(dashboard.sessionsThisMonth),
      icon: "ph ph-calendar-check",
      tone: "bg-main-600",
      href: "/admin/quiz-attempts",
    },
    {
      label: "Active subscriptions",
      value: numberValue(dashboard.activeSubscriptions),
      icon: "ph ph-credit-card",
      tone: "bg-success-600",
      href: "/admin/subscriptions",
    },
    {
      label: "Open reports",
      value: numberValue(dashboard.openReports),
      icon: "ph ph-warning-circle",
      tone: "bg-danger-600",
      href: "/admin/reports",
    },
  ],
  rows: Object.entries(dashboard.usersByRole || {})
    .map(([role, count]) => ({ role, count }))
    .sort((left, right) => Number(right.count) - Number(left.count)),
  tableTitle: "Users by role",
  columns: [
    { label: "Role", render: (row) => String(row.role).replaceAll("_", " ") },
    { label: "Users", render: (row) => numberValue(row.count) },
  ],
  emptyText: "No role totals are available.",
  charts: [
    {
      title: "Users by role",
      description: "Current account distribution across platform roles.",
      data: Object.entries(dashboard.usersByRole || {}).map(([role, count]) => ({
        label: String(role).replaceAll("_", " "),
        value: Number(count),
      })),
      icon: "ph ph-users-three",
    },
    {
      title: "Platform workload",
      description: "The main operational queues and session volume.",
      data: [
        { label: "All sessions", value: Number(dashboard.totalSessions) },
        { label: "This month", value: Number(dashboard.sessionsThisMonth) },
        { label: "Pending questions", value: Number(dashboard.pendingQuestionReview) },
        { label: "Open reports", value: Number(dashboard.openReports) },
      ],
      icon: "ph ph-chart-bar",
    },
  ],
  quickLinks: [
    { label: "Users", href: "/admin/users", icon: "ph ph-users-three" },
    { label: "Subscription plans", href: "/admin/subscription-plans", icon: "ph ph-cards" },
    { label: "Subscriptions", href: "/admin/subscriptions", icon: "ph ph-credit-card" },
    { label: "Payments", href: "/admin/payments", icon: "ph ph-receipt" },
  ],
});

const getOrganizationDashboard = (organizationsResponse) => {
  const organizations = Array.isArray(organizationsResponse) ? organizationsResponse : [];
  const statusChart = Object.entries(
    organizations.reduce((counts, organization) => {
      const status = organization.status || "UNKNOWN";
      counts[status] = (counts[status] || 0) + 1;
      return counts;
    }, {})
  ).map(([label, value]) => ({ label, value }));
  const typeChart = Object.entries(
    organizations.reduce((counts, organization) => {
      const type = organization.type || "UNKNOWN";
      counts[type] = (counts[type] || 0) + 1;
      return counts;
    }, {})
  ).map(([label, value]) => ({ label: String(label).replaceAll("_", " "), value }));

  return {
    stats: [
      {
        label: "Organizations",
        value: numberValue(organizations.length),
        icon: "ph ph-buildings",
        tone: "bg-main-600",
        href: "/admin/organizations",
      },
      {
        label: "Active",
        value: numberValue(organizations.filter((organization) => organization.status === "ACTIVE").length),
        icon: "ph ph-check-circle",
        tone: "bg-success-600",
        href: "/admin/organizations",
      },
      {
        label: "Courses",
        value: numberValue(organizations.filter((organization) => organization.type === "COURSE").length),
        icon: "ph ph-books",
        tone: "bg-warning-600",
        href: "/admin/organizations",
      },
      {
        label: "Schools & tutors",
        value: numberValue(
          organizations.filter((organization) => organization.type !== "COURSE").length
        ),
        icon: "ph ph-chalkboard-teacher",
        tone: "bg-main-600",
        href: "/admin/organizations",
      },
    ],
    rows: organizations,
    tableTitle: "My organizations",
    columns: [
      { label: "Name", render: (row) => row.name || "-" },
      { label: "Type", render: (row) => String(row.type || "-").replaceAll("_", " ") },
      { label: "Status", render: (row) => <AdminStatusBadge status={row.status} /> },
      {
        label: "Completion alerts",
        render: (row) => (row.notifyOnMemberCompletion ? "Enabled" : "Disabled"),
      },
    ],
    emptyText: "No organizations found.",
    charts: [
      {
        title: "Organization status",
        description: "Active and archived organizations that you own.",
        data: statusChart,
        icon: "ph ph-buildings",
      },
      {
        title: "Organization types",
        description: "Distribution of your courses, schools and tutor organizations.",
        data: typeChart,
        icon: "ph ph-chart-pie-slice",
      },
    ],
    quickLinks: [
      { label: "Organizations", href: "/admin/organizations", icon: "ph ph-buildings" },
      { label: "Members", href: "/admin/members", icon: "ph ph-users-three" },
      { label: "Invites", href: "/admin/invites", icon: "ph ph-ticket" },
      { label: "Notifications", href: "/admin/notifications", icon: "ph ph-bell-ringing" },
    ],
  };
};

const StatCard = ({ stat }) => (
  <div className='col-xl-4 col-sm-6'>
    <div className='px-20 py-20 bg-white rounded-10 h-100'>
      <div className='d-flex gap-16 justify-content-between mb-12'>
        <div className='min-w-0'>
          <span className='fw-normal text-14 text-neutral-400 mb-4 d-block'>{stat.label}</span>
          <h6 className='text-20 fw-semibold text-neutral-500 mb-0 text-break'>{stat.value}</h6>
        </div>
        <span
          className={`w-44 h-44 ${stat.tone} text-white rounded-circle justify-content-center align-items-center d-flex flex-shrink-0`}
        >
          <i className={`${stat.icon} text-xl`} />
        </span>
      </div>
      <Link href={stat.href} className='text-12 fw-medium text-main-600 text-decoration-underline'>
        View details
      </Link>
    </div>
  </div>
);

const AdminDashboardHome = () => {
  const { user } = useAuth();
  const role = getPrimaryRole(user);
  const [dashboard, setDashboard] = useState(emptyDashboard);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    if (!role) return;

    setIsLoading(true);
    setError("");

    try {
      if (role === "admin") {
        setDashboard(getAdminDashboard(await fetchAdminDashboard()));
      } else if (role === "parent") {
        setDashboard(getParentDashboard(await fetchParentDashboard()));
      } else if (role === "child") {
        const [results, trends] = await Promise.all([
          fetchResults({ page: 1, perPage: 5 }),
          fetchResultTrends(),
        ]);
        setDashboard(getChildDashboard(results, trends));
      } else if (role === "organization") {
        setDashboard(getOrganizationDashboard(await fetchMyOrganizations()));
      }
    } catch (requestError) {
      setDashboard(emptyDashboard);
      setError(requestError?.message || "Dashboard data could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }, [role]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const title = useMemo(() => roleLabels[role] || "Dashboard", [role]);

  return (
    <div className='px-24 py-24'>
      <div className='d-flex flex-wrap align-items-center justify-content-between gap-16 mb-24'>
        <div>
          <h4 className='fw-semibold text-neutral-500 text-20 mb-4'>{title}</h4>
          <p className='text-14 text-neutral-400 mb-0'>{roleDescriptions[role] || ""}</p>
        </div>
        <AdminRefreshButton isLoading={isLoading} onClick={loadDashboard} />
      </div>

      {error ? <div className='alert alert-danger text-14 py-10 mb-24'>{error}</div> : null}

      {isLoading ? (
        <div className='bg-white rounded-10 px-24 py-24 text-neutral-400'>Loading dashboard...</div>
      ) : (
        <>
          <div className='row gy-4 mb-24'>
            {dashboard.stats.map((stat) => (
              <StatCard key={stat.label} stat={stat} />
            ))}
          </div>

          <DashboardCharts charts={dashboard.charts} />

          <div className='row gy-4'>
            <div className='col-xl-8'>
              <div className='bg-white rounded-10 px-24 py-24 h-100'>
                <div className='d-flex align-items-center justify-content-between gap-16 mb-20'>
                  <h5 className='text-16 fw-semibold text-neutral-500 mb-0'>{dashboard.tableTitle}</h5>
                  <span className='text-12 text-neutral-400'>{dashboard.rows.length} shown</span>
                </div>
                <div className='table-responsive admin-users-table'>
                  <table className='table mb-0'>
                    <thead>
                      <tr>
                        {dashboard.columns.map((column) => (
                          <th className='text-12 fw-medium text-neutral-500 py-16 px-20' key={column.label}>
                            {column.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.rows.length ? (
                        dashboard.rows.map((row, rowIndex) => (
                          <tr key={row.id || row.learnerId || row.subjectId || row.role || rowIndex}>
                            {dashboard.columns.map((column) => (
                              <td className='py-16 px-20 text-14 text-neutral-500' key={column.label}>
                                {column.render(row)}
                              </td>
                            ))}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td className='py-24 px-20 text-neutral-400' colSpan={Math.max(dashboard.columns.length, 1)}>
                            {dashboard.emptyText || "No dashboard data found."}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className='col-xl-4'>
              <div className='bg-white rounded-10 px-24 py-24 h-100'>
                <h5 className='text-16 fw-semibold text-neutral-500 mb-20'>Quick access</h5>
                <div className='d-flex flex-column gap-12'>
                  {dashboard.quickLinks.map((item) => (
                    <Link
                      href={item.href}
                      className='d-flex align-items-center justify-content-between gap-12 border border-neutral-30 rounded-8 px-16 py-14 text-neutral-500 hover-text-main-600'
                      key={item.href}
                    >
                      <span className='d-flex align-items-center gap-10 text-14 fw-medium'>
                        <i className={`${item.icon} text-main-600 text-lg`} />
                        {item.label}
                      </span>
                      <i className='ph ph-arrow-right' />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboardHome;
