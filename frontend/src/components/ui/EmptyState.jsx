import React from "react";
import Button from "./Button";

export default function EmptyState({
  title = "No interviews yet",
  description = "Complete your first mock interview to start tracking your progress.",
  actionLabel = "Start Mock Interview",
  onAction,
  actionHref,
  icon: Icon,
  className = "",
}) {
  return (
    <div
      className={`card ${className}`.trim()}
      style={{
        padding: "56px 32px",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ maxWidth: "440px", margin: "0 auto" }}>
        {/* Subtle geometric warm icon container */}
        <div
          style={{
            width: "68px",
            height: "68px",
            borderRadius: "50%",
            backgroundColor: "var(--primary-subtle)",
            border: "1px solid var(--primary-border)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--primary)",
            marginBottom: "20px",
          }}
        >
          {Icon ? (
            <Icon size={32} strokeWidth={1.8} />
          ) : (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <polyline points="12 7 12 12 15 15" />
            </svg>
          )}
        </div>

        <h3
          style={{
            fontSize: "1.375rem",
            color: "var(--text-main)",
            marginBottom: "8px",
            fontWeight: 700,
          }}
        >
          {title}
        </h3>

        <p
          style={{
            fontSize: "0.9375rem",
            color: "var(--text-muted)",
            lineHeight: 1.6,
            marginBottom: "24px",
          }}
        >
          {description}
        </p>

        {actionLabel && (
          <div>
            {actionHref ? (
              <a href={actionHref} className="btn btn-primary btn-md">
                {actionLabel}
              </a>
            ) : (
              <Button variant="primary" size="md" onClick={onAction}>
                {actionLabel}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
