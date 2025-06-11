import React, { useState } from "react";
import { Header } from "@tanstack/react-table";
import { Row } from "@/app/(authenticated)/relational-ui/components/Sheet";

const RESIZER_HITBOX = 20;
const RESIZER_BAR = 3;

type ResizeEvent = React.MouseEvent<Element> | React.TouchEvent<Element>;

export default function ColumnResizeHandle({ header }: { header: Header<Row, unknown> }) {
  const [hover, setHover] = useState(false);

  const stopDnDAndResize = (e: ResizeEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const handler = header.getResizeHandler();
    if (handler) handler(e);
  };

  return (
    <div
      className="absolute top-0 right-0 h-full z-20 select-none"
      style={{
        width: RESIZER_HITBOX,
        cursor: header.column.getCanResize() ? "col-resize" : "default",
        pointerEvents: header.column.getCanResize() ? "auto" : "none",
        touchAction: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        userSelect: "none",
        WebkitUserSelect: "none",
        WebkitTouchCallout: "none",
        WebkitTapHighlightColor: "transparent",
      }}
      onMouseDown={stopDnDAndResize}
      onTouchStart={stopDnDAndResize}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div
        className="transition-opacity duration-75"
        style={{
          opacity: hover ? 1 : 0.6,
          width: RESIZER_BAR,
          height: "65%",
          borderRadius: 2,
          marginLeft: (RESIZER_HITBOX - RESIZER_BAR) / 2,
          marginRight: (RESIZER_HITBOX - RESIZER_BAR) / 2,
          background: "#999",
        }}
      />
    </div>
  );
}
