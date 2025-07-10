import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Header } from "@tanstack/react-table";
import { Row } from "@/app/(authenticated)/relational-ui/components/Sheet";

interface Props {
  header: Header<Row, unknown>;
  children: (dragHandleProps: React.HTMLAttributes<HTMLSpanElement>) => React.ReactNode;
}

export default function DraggableHeaderCell({ header, children }: Props) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: header.column.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: "grab",
    zIndex: isDragging ? 60 : undefined,
    background: isDragging ? "#e5e7eb" : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="relative"
    >
      {children(listeners as React.HTMLAttributes<HTMLSpanElement>)} {/* Correctly typed */}
    </div>
  );
}
