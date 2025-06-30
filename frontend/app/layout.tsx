import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ClientLayoutWrapper from "@/components/ClientLayoutWrapper";
import { UserSettingsProvider } from "@/components/UserSettingsContext";
import FontSizeVarsProvider from "@/components/settings/font/FontSizeVarsProvider";
import { NavbarProvider } from "@/components/nav/NavbarContext";
import { ThemeProvider } from "@/components/settings/theme/ThemeContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SupplyWise",
  description: "Smarter procurement, forecasting, and analysis.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} ...`}>
        <ThemeProvider>
          <NavbarProvider>
            <UserSettingsProvider>
              <FontSizeVarsProvider>
                <ClientLayoutWrapper>{children}</ClientLayoutWrapper>
              </FontSizeVarsProvider>
            </UserSettingsProvider>
          </NavbarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
