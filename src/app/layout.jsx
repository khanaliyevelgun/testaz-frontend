import BootstrapInit from "@/helper/BootstrapInit";
import RouteScrollToTop from "@/helper/RouteScrollToTop";
import LoadPhosphorIcons from "@/helper/LoadPhosphorIcons";
import LocaleProvider from "@/components/LocaleProvider";
import { AuthProvider } from "@/stores/authStore";

import "./font.css";
import "./globals.scss";

export const metadata = {
  title: "EduAll | Təhsil platforması",
  description: "Onlayn təhsil, imtahan və öyrənmə idarəetməsi platforması.",
};

export default function RootLayout({ children }) {
  return (
    <html lang='az'>
      <body suppressHydrationWarning={true}>
        <BootstrapInit />
        <LoadPhosphorIcons />
        <RouteScrollToTop />
        <LocaleProvider>
          <AuthProvider>{children}</AuthProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
