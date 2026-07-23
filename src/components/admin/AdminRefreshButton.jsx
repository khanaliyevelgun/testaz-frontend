"use client";
import StaticText from "@/components/StaticText";


const AdminRefreshButton = ({ isLoading = false, onClick, label }) => (
  <button
    type='button'
    className='admin-refresh-btn px-16 py-10 border border-neutral-40 rounded-pill text-14 text-neutral-500 d-flex align-items-center gap-8 bg-white'
    aria-label='Yenilə'
    aria-busy={isLoading}
    disabled={isLoading}
    onClick={onClick}
  >
    <i className={`ph ph-arrows-clockwise ${isLoading ? "ph-spin" : ""}`} aria-hidden='true'></i>
    {isLoading ? <StaticText text={"Loading..."} /> : label || <StaticText text={"Refresh"} />}
  </button>
);

export default AdminRefreshButton;
