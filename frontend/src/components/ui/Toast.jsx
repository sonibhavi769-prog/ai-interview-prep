import React from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export default function Toast({
  message,
  type = "success", // 'success' | 'info' | 'error'
  onClose,
}) {
  if (!message) return null;

  return (
    <div className="toast-notice" role="alert">
      {type === "error" ? (
        <AlertCircle size={18} color="var(--primary)" />
      ) : type === "info" ? (
        <Info size={18} color="var(--primary)" />
      ) : (
        <CheckCircle2 size={18} color="var(--primary)" />
      )}
      <span>{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--text-muted)",
            display: "inline-flex",
            alignItems: "center",
            marginLeft: "8px",
            padding: "2px",
          }}
          aria-label="Close"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
