"use client";

import React from "react";
import { TableSettingsProvider } from "@/app/(authenticated)/relational-ui/components/UX/TableSettingsContext";
import SheetsPageWithFontVars from "./SheetsPageWithFontVars";

export default function SheetsPage() {
  return (
    <TableSettingsProvider>
      <SheetsPageWithFontVars />
    </TableSettingsProvider>
  );
}
