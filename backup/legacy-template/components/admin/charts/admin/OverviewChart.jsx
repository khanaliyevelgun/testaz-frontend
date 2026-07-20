const studentPoints = [42, 58, 50, 74, 68, 92, 86, 110, 98, 122, 116, 138];
const coursePoints = [26, 36, 34, 48, 46, 64, 60, 72, 70, 88, 82, 96];

const toPath = (points, width, height, maxValue) =>
  points
    .map((value, index) => {
      const x = (index / (points.length - 1)) * width;
      const y = height - (value / maxValue) * height;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

const OverviewChart = () => {
  const width = 640;
  const height = 240;
  const maxValue = 150;

  return (
    <div className='w-100 overflow-x-auto'>
      <svg viewBox={`0 0 ${width} ${height}`} className='w-100' role='img' aria-label='Overview chart'>
        {[0, 1, 2, 3, 4].map((line) => {
          const y = (line / 4) * height;
          return (
            <line
              key={line}
              x1='0'
              x2={width}
              y1={y}
              y2={y}
              stroke='var(--neutral-30)'
              strokeWidth='1'
            />
          );
        })}
        <path
          d={toPath(studentPoints, width, height, maxValue)}
          fill='none'
          stroke='var(--main-600)'
          strokeWidth='4'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
        <path
          d={toPath(coursePoints, width, height, maxValue)}
          fill='none'
          stroke='var(--warning-600)'
          strokeWidth='4'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
      </svg>
    </div>
  );
};

export default OverviewChart;
