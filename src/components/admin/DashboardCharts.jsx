"use client";

const formatNumber = (value) => new Intl.NumberFormat("az-AZ").format(Number(value || 0));

const formatValue = (value, unit) => `${formatNumber(value)}${unit || ""}`;

const BarChart = ({ data, unit }) => {
  const items = data.filter((item) => Number.isFinite(Number(item.value))).slice(0, 8);
  const maxValue = Math.max(...items.map((item) => Number(item.value)), 1);

  if (!items.length) return <p className='text-14 text-neutral-400 mb-0'>No chart data yet.</p>;

  return (
    <div className='d-flex flex-column gap-12'>
      {items.map((item) => (
        <div key={item.label}>
          <div className='d-flex align-items-center justify-content-between gap-12 mb-6'>
            <span className='text-13 text-neutral-500 text-truncate'>{item.label}</span>
            <strong className='text-13 text-neutral-500 flex-shrink-0'>{formatValue(item.value, unit)}</strong>
          </div>
          <div className='h-8 bg-main-25 rounded-pill overflow-hidden'>
            <span
              className='d-block h-100 bg-main-600 rounded-pill'
              style={{ width: `${Math.max((Number(item.value) / maxValue) * 100, item.value > 0 ? 3 : 0)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

const LineChart = ({ data, unit }) => {
  const items = data.filter((item) => Number.isFinite(Number(item.value))).slice(-10);
  const width = 640;
  const height = 220;
  const padding = 24;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  const maxValue = Math.max(...items.map((item) => Number(item.value)), 100);
  const minValue = Math.min(...items.map((item) => Number(item.value)), 0);
  const range = Math.max(maxValue - minValue, 1);
  const points = items.map((item, index) => {
    const x = items.length === 1 ? width / 2 : padding + (index / (items.length - 1)) * chartWidth;
    const y = padding + (1 - (Number(item.value) - minValue) / range) * chartHeight;
    return { ...item, x, y };
  });

  if (!items.length) return <p className='text-14 text-neutral-400 mb-0'>Complete a test to see your progress chart.</p>;

  return (
    <div className='w-100 overflow-x-auto'>
      <svg viewBox={`0 0 ${width} ${height}`} className='w-100' role='img' aria-label='Progress chart'>
        {[0, 1, 2, 3, 4].map((line) => {
          const y = padding + (line / 4) * chartHeight;
          return <line key={line} x1={padding} x2={width - padding} y1={y} y2={y} stroke='var(--neutral-30)' strokeWidth='1' />;
        })}
        <polyline
          points={points.map((point) => `${point.x},${point.y}`).join(" ")}
          fill='none'
          stroke='var(--main-600)'
          strokeWidth='4'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
        {points.map((point, index) => (
          <g key={`${point.label}-${index}`}>
            <circle cx={point.x} cy={point.y} r='5' fill='white' stroke='var(--main-600)' strokeWidth='3' />
            <text x={point.x} y={height - 4} textAnchor='middle' className='text-11' fill='var(--neutral-400)'>{point.label}</text>
          </g>
        ))}
      </svg>
      <div className='text-12 text-neutral-400 mt-4'>Faiz: {formatValue(Math.min(Math.max(items[items.length - 1].value, 0), 100), unit)}</div>
    </div>
  );
};

const DashboardCharts = ({ charts = [] }) => {
  if (!charts.length) return null;

  return (
    <div className='row gy-4 mb-24'>
      {charts.map((chart) => (
        <div className={charts.length === 1 ? 'col-12' : 'col-xl-6'} key={chart.title}>
          <div className='bg-white rounded-10 px-24 py-24 h-100'>
            <div className='d-flex align-items-start justify-content-between gap-12 mb-20'>
              <div>
                <h5 className='text-16 fw-semibold text-neutral-500 mb-4'>{chart.title}</h5>
                {chart.description ? <p className='text-13 text-neutral-400 mb-0'>{chart.description}</p> : null}
              </div>
              <i className={`${chart.icon || "ph ph-chart-line-up"} text-main-600 text-xl`} />
            </div>
            {chart.type === "line" ? <LineChart data={chart.data || []} unit={chart.unit} /> : <BarChart data={chart.data || []} unit={chart.unit} />}
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardCharts;
