import React from "react";

export default function Button({
  children,
  variant = "primary", // 'primary' | 'secondary' | 'outline' | 'ghost'
  size = "md", // 'sm' | 'md' | 'lg'
  fullWidth = false,
  className = "",
  icon: Icon,
  iconRight: IconRight,
  disabled = false,
  type = "button",
  onClick,
  ...props
}) {
  const variantClass = `btn-${variant}`;
  const sizeClass = size !== "md" ? `btn-${size}` : "";
  const fullWidthClass = fullWidth ? "btn-full" : "";

  return (
    <button
      type={type}
      className={`btn ${variantClass} ${sizeClass} ${fullWidthClass} ${className}`.trim()}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {Icon && <Icon size={size === "sm" ? 15 : size === "lg" ? 20 : 17} strokeWidth={2} />}
      {children}
      {IconRight && <IconRight size={size === "sm" ? 15 : size === "lg" ? 20 : 17} strokeWidth={2} />}
    </button>
  );
}
