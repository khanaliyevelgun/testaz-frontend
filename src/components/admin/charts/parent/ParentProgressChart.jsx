const ParentProgressChart = () => (
  <div className='px-20 py-20 bg-white rounded-10'>
    <h6 className='mb-16 fw-medium text-16 text-neutral-500'>Child Progress</h6>
    <div className='d-flex flex-column gap-16'>
      {[
        ["Mathematics", 82],
        ["Science", 74],
        ["Language", 91],
      ].map(([label, value]) => (
        <div key={label}>
          <div className='d-flex justify-content-between mb-8 text-14 text-neutral-500'>
            <span>{label}</span>
            <span>{value}%</span>
          </div>
          <div className='h-8 bg-main-25 rounded-pill overflow-hidden'>
            <span className='d-block h-100 bg-main-600 rounded-pill' style={{ width: `${value}%` }}></span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default ParentProgressChart;
