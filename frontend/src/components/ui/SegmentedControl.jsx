import React from "react";

export default function SegmentedControl({
  options = [], // array of strings or { label, value }
  value,
  onChange,
  className = "",
  id,
}) {
  return (
    <div className={`segmented-control ${className}`.trim()} id={id} role="group">
      {options.map((option) => {
        const optionVal = typeof option === "object" ? option.value : option;
        const optionLabel = typeof option === "object" ? option.label : option;
        const isActive = value === optionVal;

        return (
          <button
            type="button"
            key={optionVal}
            className={`segmented-option ${isActive ? "active" : ""}`}
            onClick={() => onChange && onChange(optionVal)}
            aria-pressed={isActive}
          >
            {optionLabel}
          </button>
        );
      })}
    </div>
  );
}
