import React from "react";

export default function Badge({
  children,
  variant = "secondary", // 'primary' | 'secondary' | 'completed' | 'neutral'
  icon: Icon,
  className = "",
  style,
}) {
  const variantClass = variant === "primary"
    ? "badge-primary"
    : variant === "completed"
    ? "badge-completed"
    : variant === "neutral"
    ? "badge-neutral"
    : "";

  return (
    <span className={`badge ${variantClass} ${className}`.trim()} style={style}>
      {Icon && <Icon size={12} strokeWidth={2.2} />}
      {children}
    </span>
  );
}
