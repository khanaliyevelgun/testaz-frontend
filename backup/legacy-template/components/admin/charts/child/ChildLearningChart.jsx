const ChildLearningChart = () => (
  <div className='px-20 py-20 bg-white rounded-10'>
    <h6 className='mb-16 fw-medium text-16 text-neutral-500'>Weekly Learning</h6>
    <div className='d-flex align-items-end gap-12' style={{ height: 160 }}>
      {[38, 64, 52, 80, 72, 92, 66].map((value, index) => (
        <div className='flex-grow-1 d-flex flex-column align-items-center gap-8' key={index}>
          <span
            className='w-100 bg-main-600 rounded-top-8 d-inline-block'
            style={{ height: `${value}%` }}
          ></span>
          <span className='text-12 text-neutral-400'>{["M", "T", "W", "T", "F", "S", "S"][index]}</span>
        </div>
      ))}
    </div>
  </div>
);

export default ChildLearningChart;
