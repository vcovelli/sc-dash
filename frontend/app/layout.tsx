import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ClientLayoutWrapper from "@/components/ClientLayoutWrapper";
import { UserSettingsProvider } from "@/components/UserSettingsContext";
import FontSizeVarsProvider from "@/components/FontSizeVarsProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SupplyWise",
  description: "Smarter procurement, forecasting, and analysis.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300 min-h-screen`}>
        <UserSettingsProvider>
          <FontSizeVarsProvider>
            <ClientLayoutWrapper>{children}</ClientLayoutWrapper>
          </FontSizeVarsProvider>
        </UserSettingsProvider>
      </body>
    </html>
  );
}
