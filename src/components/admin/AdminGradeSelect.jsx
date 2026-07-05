"use client";

const getMaxGrade = () => {
  const configured = Number(process.env.NEXT_PUBLIC_MAX_GRADE || 11);
  return Number.isFinite(configured) && configured > 0 ? Math.floor(configured) : 11;
};

const AdminGradeSelect = ({ label = "Grade", value, onChange, required = false, minWidthClass = "" }) => {
  const grades = Array.from({ length: getMaxGrade() }, (_, index) => index + 1);

  return (
    <div className={minWidthClass}>
      {label ? <label className='text-14 text-neutral-500 fw-medium mb-8'>{label}</label> : null}
      <select
        className='form-select rounded-pill border-neutral-40 text-14 py-11 px-16'
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        required={required}
      >
        <option value=''>Grade</option>
        {grades.map((grade) => (
          <option value={grade} key={grade}>{grade}</option>
        ))}
      </select>
    </div>
  );
};

export default AdminGradeSelect;
