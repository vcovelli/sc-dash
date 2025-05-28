"use client";

import React from "react";
import { CustomColumnDef } from "@relational/lib/types";

interface LinkCellProps {
  value: string;
  rowId: string;
  column: CustomColumnDef<any>;
  editing?: boolean;
  onSave?: (id: string, key: string, value: any) => void;
  onEditComplete?: () => void;
  onStartEdit?: () => void;
}

const LinkCell: React.FC<LinkCellProps> = ({
  value,
}) => {
  if (!value) return null;

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
};

export default LinkCell;
