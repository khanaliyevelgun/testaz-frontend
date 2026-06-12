import AdminLayout from "@/components/admin/AdminLayout";

export const metadata = {
  title: "Admin Dashboard - EduAll",
  description: "EduAll role-based dashboard area.",
};

export default function Layout({ children }) {
  return <AdminLayout>{children}</AdminLayout>;
}
