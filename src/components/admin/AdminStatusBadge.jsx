import StaticText from "@/components/StaticText";

const statusClasses = {
  ACTIVE: "bg-success-50 text-success-600",
  OPEN: "bg-warning-50 text-warning-700",
  PENDING_REVIEW: "bg-warning-50 text-warning-700",
  RUNNING: "bg-main-25 text-main-600",
  COMPLETED: "bg-success-50 text-success-600",
  RESOLVED: "bg-success-50 text-success-600",
  DISMISSED: "bg-neutral-30 text-neutral-500",
  DRAFT: "bg-neutral-30 text-neutral-500",
  REJECTED: "bg-danger-50 text-danger-600",
  FAILED: "bg-danger-50 text-danger-600",
  ARCHIVED: "bg-neutral-30 text-neutral-500",
  INACTIVE: "bg-neutral-30 text-neutral-500",
  SUSPENDED: "bg-warning-50 text-warning-700",
  DELETED: "bg-danger-50 text-danger-600",
  PENDING: "bg-warning-50 text-warning-700",
  // Trend directions (student_subject_stats / student_topic_stats): color-coded by sentiment —
  // improving is good (green), declining is bad (red/warning), steady/insufficient is neutral.
  IMPROVING: "bg-success-50 text-success-600",
  DECLINING: "bg-danger-50 text-danger-600",
  STEADY: "bg-main-25 text-main-600",
  INSUFFICIENT_DATA: "bg-neutral-30 text-neutral-500",
};

// Trend values are dynamic (not literal JSX text), so they get a translated label here rather than
// through the static-text extraction pipeline. Exported so trend cells elsewhere (e.g. an icon-led
// trend column) can show the same localized wording without duplicating the map.
export const TREND_LABELS = {
  IMPROVING: "Yaxşılaşır",
  DECLINING: "Pisləşir",
  STEADY: "Sabit",
  INSUFFICIENT_DATA: "Kifayət qədər məlumat yoxdur",
};

const AdminStatusBadge = ({ status, label }) => {
  const value = status || "-";
  const trendLabel = TREND_LABELS[value];
  return (
    <span className={`px-12 py-4 rounded-pill text-12 fw-medium ${statusClasses[value] || "bg-main-25 text-main-600"}`}>
      {label || (trendLabel ? <StaticText text={trendLabel} /> : String(value).replaceAll("_", " "))}
    </span>
  );
};

export default AdminStatusBadge;
