import React from "react";

export function Skeleton({ width, height, borderRadius, style, className = "" }) {
  return (
    <div
      className={`skeleton ${className}`.trim()}
      style={{
        width: width || "100%",
        height: height || "16px",
        borderRadius: borderRadius || "var(--r-sm)",
        ...style,
      }}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Skeleton width="40%" height="18px" />
        <Skeleton width="20%" height="14px" />
      </div>
      <Skeleton width="75%" height="32px" />
      <Skeleton width="55%" height="14px" />
    </div>
  );
}

export default Skeleton;
