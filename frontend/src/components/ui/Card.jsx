import React from "react";

export function Card({
  children,
  className = "",
  size = "default", // 'compact' | 'default' | 'lg'
  onClick,
  style,
  ...props
}) {
  const sizeClass = size === "lg" ? "card-lg" : size === "compact" ? "card-compact" : "";

  return (
    <div
      className={`card ${sizeClass} ${className}`.trim()}
      style={style}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  children,
  className = "",
  style,
}) {
  return (
    <div className={`card-header ${className}`.trim()} style={style}>
      <div>
        {title && <h3 className="card-title">{title}</h3>}
        {subtitle && <p className="card-subtitle">{subtitle}</p>}
        {children}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export default Card;
