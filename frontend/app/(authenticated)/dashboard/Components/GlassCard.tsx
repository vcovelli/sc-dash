import React from "react";

const GlassCard = React.forwardRef<HTMLDivElement, React.HTMLProps<HTMLDivElement>>(
  ({ className = "", children, ...props }, ref) => (
    <div
      ref={ref}
      className={`rounded-2xl bg-white/80 dark:bg-gray-900/80 shadow-xl backdrop-blur-xl border border-white/20 dark:border-gray-900/30 p-4 sm:p-6 text-gray-900 dark:text-gray-100 ${className}`}
      style={{ fontSize: "inherit" }}
      {...props}
    >
      {children}
    </div>
  )
);
GlassCard.displayName = "GlassCard";
export default GlassCard;
