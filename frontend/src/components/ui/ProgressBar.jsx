import React from "react";

export default function ProgressBar({
  label,
  value, // number (0 to 100)
  displayValue,
  variant = "primary", // 'primary' | 'secondary'
  height = 8,
  className = "",
  style,
}) {
  const clampedValue = Math.min(100, Math.max(0, Number(value) || 0));
  const isSecondary = variant === "secondary";

  return (
    <div className={`progress-bar-container ${className}`.trim()} style={style}>
      {label && (
        <div className="progress-bar-header">
          <span>{label}</span>
          <span style={{ color: isSecondary ? "var(--secondary)" : "var(--primary)", fontWeight: 700 }}>
            {displayValue !== undefined ? displayValue : `${clampedValue}%`}
          </span>
        </div>
      )}
      <div className="progress-track" style={{ height: `${height}px` }}>
        <div
          className={`progress-fill ${isSecondary ? "progress-fill-secondary" : ""}`}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
}
