import React from "react";

export function PageContainer({ children, className = "", style, maxWidth }) {
  return (
    <div className="main-content">
      <div
        className={`container ${className}`.trim()}
        style={maxWidth ? { maxWidth: `${maxWidth}px`, ...style } : style}
      >
        {children}
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  children,
  badge,
  action,
  className = "",
}) {
  return (
    <div className={`page-header ${className}`.trim()}>
      <div className="page-header__content">
        {badge && <div style={{ marginBottom: "8px" }}>{badge}</div>}
        <h1 className="page-header__title">{title}</h1>
        {subtitle && <p className="page-header__subtitle">{subtitle}</p>}
        {children}
      </div>
      {action && <div className="page-header__actions">{action}</div>}
    </div>
  );
}

export default PageContainer;
