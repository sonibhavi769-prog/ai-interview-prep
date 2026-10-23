import React from "react";

export default function StatCard({
  title,
  value,
  footer,
  className = "",
  valueStyle,
}) {
  return (
    <div className={`stat-card ${className}`.trim()}>
      <div className="stat-card__title">{title}</div>
      <div className="stat-card__value" style={valueStyle}>
        {value}
      </div>
      {footer && <div className="stat-card__footer">{footer}</div>}
    </div>
  );
}
