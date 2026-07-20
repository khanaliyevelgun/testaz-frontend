"use client";
import StaticText from "@/components/StaticText";


const AdminRefreshButton = ({ isLoading = false, onClick, label = "Refresh" }) => (
  <button
    type='button'
    className='px-16 py-10 border border-neutral-40 rounded-pill text-14 text-neutral-500 d-flex align-items-center gap-8 bg-white'
    disabled={isLoading}
    onClick={onClick}
  >
    <i className={`ph ph-arrows-clockwise ${isLoading ? "ph-spin" : ""}`}></i>
    {isLoading ? <StaticText text={"Loading..."} /> : label}
  </button>
);

export default AdminRefreshButton;
