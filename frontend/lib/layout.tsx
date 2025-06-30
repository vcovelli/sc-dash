import { NavbarProvider } from "@/components/nav/NavbarContext";
import DesktopNav from "@/components/nav/DesktopNav";
import HamburgerButton from "@/components/nav/HamburgerButton";
import MobileDrawerNav from "@/components/nav/MobileDrawerNav";
import Footer from "@/components/Footer";

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <NavbarProvider>
      <DesktopNav />           {/* Shows the desktop nav links if desired */}
      <HamburgerButton />      {/* Always shows, triggers menu on any screen */}
      <MobileDrawerNav />      {/* Always mounted, slides in/out */}
      <div className="min-h-screen flex flex-col">
        <main className="flex-grow">{children}</main>
        <Footer />
      </div>
    </NavbarProvider>
  );
}
