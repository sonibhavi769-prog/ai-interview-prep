import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageContainer from "../components/ui/PageContainer";
import SegmentedControl from "../components/ui/SegmentedControl";
import EmptyState from "../components/ui/EmptyState";
import { FileQuestion, LineChart, SearchX } from "lucide-react";

export default function EmptyStatesDemo() {
  const navigate = useNavigate();
  const [activeVariant, setActiveVariant] = useState("interviews");

  return (
    <PageContainer maxWidth={760}>
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div style={{ textAlign: "center", marginBottom: "var(--sp-28)" }}>
        <h1 style={{ fontSize: "2rem", color: "var(--text-main)", marginBottom: "var(--sp-6)" }}>
          Empty State Experience
        </h1>
        <p style={{ fontSize: "0.95rem", color: "var(--text-muted)" }}>
          Calm, thoughtful empty states designed with subtle iconography and warm tones.
        </p>

        {/* Variant Switcher */}
        <div style={{ display: "inline-flex", marginTop: "var(--sp-16)" }}>
          <SegmentedControl
            options={[
              { label: "No Interviews Yet", value: "interviews" },
              { label: "Empty Analytics", value: "analytics" },
              { label: "No Search Matches", value: "search" },
            ]}
            value={activeVariant}
            onChange={setActiveVariant}
          />
        </div>
      </div>

      {/* ── Active Empty State Container ─────────────────────────────── */}
      {activeVariant === "interviews" && (
        <EmptyState
          icon={FileQuestion}
          title="No interviews yet"
          description="Complete your first mock interview to start tracking your progress."
          actionLabel="Start Mock Interview"
          onAction={() => navigate("/practice")}
        />
      )}

      {activeVariant === "analytics" && (
        <EmptyState
          icon={LineChart}
          title="Awaiting performance data"
          description="After your first session evaluation, detailed competence trends and readiness indices will visualize here automatically."
          actionLabel="Start Mock Interview"
          onAction={() => navigate("/practice")}
        />
      )}

      {activeVariant === "search" && (
        <EmptyState
          icon={SearchX}
          title="No matching sessions found"
          description="We couldn't find any mock interview sessions matching your search or filters. Try adjusting your query."
          actionLabel="Clear Filters"
          onAction={() => navigate("/interviews")}
        />
      )}
    </PageContainer>
  );
}
