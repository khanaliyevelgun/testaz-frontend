import StaticText from "@/components/StaticText";
const AdminPlaceholderPage = ({ title, description }) => (
  <div className='px-24 py-24'>
    <div className='bg-white rounded-10 px-24 py-24'>
      <h4 className='fw-semibold text-neutral-500 text-20 mb-8'>{title}</h4>
      <p className='text-14 text-neutral-400 mb-0'>
        {description || <StaticText text={"Bu bölmə üçün admin komponent strukturu hazırdır."} />}
      </p>
    </div>
  </div>
);

export default AdminPlaceholderPage;
