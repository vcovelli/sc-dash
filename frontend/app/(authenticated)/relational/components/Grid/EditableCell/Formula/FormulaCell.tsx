"use client";

import React from "react";
import { CustomColumnDef } from "@relational/lib/types";

interface FormulaCellProps {
  value: any;
  rowId: string;
  column: CustomColumnDef<any>;
  editing?: boolean;
  onSave?: (id: string, key: string, value: any) => void;
  onEditComplete?: () => void;
  onStartEdit?: () => void;
}

const FormulaCell: React.FC<FormulaCellProps> = ({
  value,
}) => {
  return (
    <div className="text-gray-700 font-mono text-xs italic px-1 py-0.5 bg-gray-50 rounded">
      {String(value)}
    </div>
  );
};

export default FormulaCell;
