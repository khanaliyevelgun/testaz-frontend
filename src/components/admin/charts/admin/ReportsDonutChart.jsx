const segments = [
  { label: "Total Courses", value: 28, color: "#6A4FEB" },
  { label: "Enrolled Courses", value: 18, color: "#9570F4" },
  { label: "Active Courses", value: 16, color: "#FACC15" },
  { label: "Completed Courses", value: 20, color: "#16A34A" },
  { label: "Total Students", value: 12, color: "#4F2EC8" },
  { label: "Total Earnings", value: 6, color: "#EAB308" },
];

const ReportsDonutChart = () => {
  let offset = 25;
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);

  return (
    <div className='flex-center py-16'>
      <svg width='220' height='220' viewBox='0 0 220 220' role='img' aria-label='Reports chart'>
        <circle cx='110' cy='110' r='82' fill='none' stroke='var(--neutral-30)' strokeWidth='28' />
        {segments.map((segment) => {
          const dash = (segment.value / total) * 515;
          const circle = (
            <circle
              key={segment.label}
              cx='110'
              cy='110'
              r='82'
              fill='none'
              stroke={segment.color}
              strokeWidth='28'
              strokeLinecap='round'
              strokeDasharray={`${dash} ${515 - dash}`}
              strokeDashoffset={offset}
              transform='rotate(-90 110 110)'
            />
          );
          offset -= dash;
          return circle;
        })}
        <text x='110' y='104' textAnchor='middle' className='text-20 fw-semibold' fill='var(--neutral-700)'>
          4,998
        </text>
        <text x='110' y='128' textAnchor='middle' className='text-12' fill='var(--neutral-400)'>
          Total
        </text>
      </svg>
    </div>
  );
};

export default ReportsDonutChart;
