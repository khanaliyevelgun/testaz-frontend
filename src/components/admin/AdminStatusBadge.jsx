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
};

const AdminStatusBadge = ({ status }) => {
  const value = status || "-";
  return (
    <span className={`px-12 py-4 rounded-pill text-12 fw-medium ${statusClasses[value] || "bg-main-25 text-main-600"}`}>
      {String(value).replaceAll("_", " ")}
    </span>
  );
};

export default AdminStatusBadge;
