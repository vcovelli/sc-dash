"use client";

import React from "react";
import { CustomColumnDef } from "@/app/(authenticated)/relational-ui/lib/types";

interface LinkCellProps {
  value: string;
  rowId: string;
  column: CustomColumnDef<any>;
  editing?: boolean;
  onSave?: (id: string, key: string, value: any) => void;
  onEditComplete?: () => void;
  onStartEdit?: () => void;
}

const LinkCell: React.FC<LinkCellProps> = React.memo(({ value }) => {
  if (!value || typeof value !== "string") return (
    <span className="text-gray-400 italic text-sm">—</span>
  );

  return (
    <a
      href={value}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 underline text-sm hover:text-blue-800"
    >
      {value}
    </a>
  );
});

export default LinkCell;
