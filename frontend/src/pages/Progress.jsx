import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { progressApi } from "../services/progressApi";
import PageContainer, { PageHeader } from "../components/ui/PageContainer";
import StatCard from "../components/ui/StatCard";
import Card, { CardHeader } from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import ProgressBar from "../components/ui/ProgressBar";
import EmptyState from "../components/ui/EmptyState";
import { CheckCircle2, AlertCircle, Play, Flame, RefreshCw } from "lucide-react";

export default function Progress() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState([]);

  const fetchProgress = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, trendsRes] = await Promise.all([
        progressApi.getStats(),
        progressApi.getTrends(),
      ]);
      setStats(statsRes.stats);
      setTrends(trendsRes.trends || []);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "Failed to load progress analytics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  if (loading) {
    return (
      <PageContainer>
        <PageHeader
          title="Your Progress"
          subtitle="Loading your performance metrics and skill evaluations..."
        />
        <div className="stats-grid" style={{ marginBottom: "var(--sp-32)" }}>
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} style={{ padding: "24px", minHeight: "120px", opacity: 0.6 }}>
              <div style={{ height: "14px", width: "40%", backgroundColor: "var(--border-subtle)", borderRadius: "4px", marginBottom: "16px" }} />
              <div style={{ height: "28px", width: "50%", backgroundColor: "var(--border-subtle)", borderRadius: "6px" }} />
            </Card>
          ))}
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <PageHeader
          title="Your Progress"
          subtitle="Understand your strengths and identify opportunities for improvement."
        />
        <Card style={{ padding: "32px", textAlign: "center" }}>
          <AlertCircle size={36} color="var(--primary)" style={{ margin: "0 auto 12px" }} />
          <h3 style={{ color: "var(--text-main)", marginBottom: "8px" }}>Could not load progress data</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginBottom: "16px" }}>{error}</p>
          <Button variant="primary" icon={RefreshCw} onClick={fetchProgress}>
            Retry
          </Button>
        </Card>
      </PageContainer>
    );
  }

  const totalSessions = stats?.total_sessions || 0;
  const completedSessions = stats?.completed_sessions || 0;

  if (totalSessions === 0) {
    return (
      <PageContainer>
        <PageHeader
          title="Your Progress"
          subtitle="Understand your strengths and identify opportunities for improvement."
          action={
            <Button
              variant="primary"
              size="md"
              icon={Play}
              onClick={() => navigate("/practice")}
              id="progress-new-interview-btn"
            >
              Start New Mock Session
            </Button>
          }
        />
        <EmptyState
          title="No Progress Data Yet"
          description="Complete your first mock interview to start tracking score trajectories, dimension ratings, and AI diagnostics."
          actionLabel="Start Mock Interview"
          onAction={() => navigate("/practice")}
        />
      </PageContainer>
    );
  }

  const dimAvg = stats?.dimension_averages || {};
  const techScore = dimAvg["Technical Accuracy"] || 0;
  const commScore = dimAvg["Communication"] || 0;
  const confScore = dimAvg["Confidence"] || 0;
  const avgScore = stats?.average_score || 0;

  const topMetrics = [
    { title: "Overall Score", value: `${avgScore}%`, subtitle: "Across evaluated sessions" },
    { title: "Technical", value: `${techScore}%`, subtitle: "Coding & domain accuracy" },
    { title: "Communication", value: `${commScore}%`, subtitle: "Clarity & articulation" },
    { title: "Confidence", value: `${confScore}%`, subtitle: "Delivery & composure" },
  ];

  const skillBreakdown = [
    { skill: "Technical Accuracy", score: techScore },
    { skill: "Communication", score: commScore },
    { skill: "Confidence", score: confScore },
  ];

  // SVG Chart Geometry
  const chartWidth = 700;
  const chartHeight = 200;
  const paddingX = 60;
  const paddingY = 35;
  const usableWidth = chartWidth - paddingX * 2;
  const usableHeight = chartHeight - paddingY * 2;

  const overallPoints = trends.map((t, idx) => {
    const x = trends.length === 1 ? chartWidth / 2 : paddingX + (idx / (trends.length - 1)) * usableWidth;
    const y = chartHeight - paddingY - (t.overall_score / 100) * usableHeight;
    return { ...t, x, y };
  });

  const techPoints = trends.map((t, idx) => {
    const x = trends.length === 1 ? chartWidth / 2 : paddingX + (idx / (trends.length - 1)) * usableWidth;
    const y = chartHeight - paddingY - (t.technical_accuracy / 100) * usableHeight;
    return { ...t, x, y };
  });

  const overallPolyline = overallPoints.map((p) => `${p.x},${p.y}`).join(" ");
  const techPolyline = techPoints.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <PageContainer>
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <PageHeader
        title="Your Progress"
        subtitle="Understand your strengths and identify opportunities for improvement."
        action={
          <Button
            variant="primary"
            size="md"
            icon={Play}
            onClick={() => navigate("/practice")}
            id="progress-new-interview-btn"
          >
            Start New Mock Session
          </Button>
        }
      />

      {/* ── 4 Top Metrics Cards ──────────────────────────────────────── */}
      <div className="stats-grid" style={{ marginBottom: "var(--sp-32)" }}>
        {topMetrics.map((m, idx) => (
          <StatCard
            key={idx}
            title={m.title}
            value={m.value}
            footer={m.subtitle}
          />
        ))}
      </div>

      {/* ── Performance Over Time (Minimal Line Chart) ───────────────── */}
      <Card style={{ marginBottom: "var(--sp-32)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-20)", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h2 style={{ fontSize: "1.25rem", color: "var(--text-main)", marginBottom: "4px" }}>
              Performance Over Time
            </h2>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              Score trajectory across all evaluated mock interview milestones.
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", color: "var(--text-body)" }}>
              <span style={{ width: "14px", height: "3px", backgroundColor: "var(--primary)", display: "inline-block", borderRadius: "2px" }} />
              Overall Score
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", color: "var(--text-body)" }}>
              <span style={{ width: "14px", height: "3px", backgroundColor: "var(--secondary)", display: "inline-block", borderRadius: "2px" }} />
              Technical
            </div>
          </div>
        </div>

        {trends.length < 2 ? (
          <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-muted)" }}>
            <p style={{ fontSize: "0.95rem" }}>
              {trends.length === 1
                ? "You have completed 1 interview session. Complete another to generate a trajectory line chart."
                : "No trend data yet. Complete evaluated sessions to visualize your trajectory."}
            </p>
          </div>
        ) : (
          <div className="chart-wrapper">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="line-chart-svg">
              {/* Grid lines */}
              {[20, 40, 60, 80, 100].map((val) => {
                const y = chartHeight - paddingY - (val / 100) * usableHeight;
                return (
                  <g key={val}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={chartWidth - paddingX}
                      y2={y}
                      stroke="var(--border-subtle)"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={paddingX - 10}
                      y={y + 4}
                      fill="var(--text-muted)"
                      fontSize="11"
                      textAnchor="end"
                      fontFamily="var(--font-body)"
                    >
                      {val}%
                    </text>
                  </g>
                );
              })}

              {/* Overall Score Line (#88665D) */}
              <polyline
                fill="none"
                stroke="var(--primary)"
                strokeWidth="3"
                points={overallPolyline}
              />

              {/* Technical Score Line (#BCAA99) */}
              <polyline
                fill="none"
                stroke="var(--secondary)"
                strokeWidth="2.5"
                strokeDasharray="3 3"
                points={techPolyline}
              />

              {/* Data Dots */}
              {overallPoints.map((pt, i) => (
                <g key={i}>
                  <circle cx={pt.x} cy={pt.y} r="5" fill="#FFFFFF" stroke="var(--primary)" strokeWidth="3" />
                  <text x={pt.x} y={pt.y - 10} fill="var(--primary)" fontSize="11" fontWeight="700" textAnchor="middle" fontFamily="var(--font-heading)">
                    {pt.overall_score}%
                  </text>
                  <text x={pt.x} y={chartHeight - 10} fill="var(--text-muted)" fontSize="11" textAnchor="middle" fontFamily="var(--font-body)">
                    {pt.date}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        )}
      </Card>

      {/* ── Skill Breakdown + Interview Summary (Two Columns) ─────────── */}
      <div className="grid-12" style={{ marginBottom: "var(--sp-32)" }}>
        {/* Skill Breakdown */}
        <div className="col-6">
          <Card style={{ height: "100%" }}>
            <CardHeader
              title="Skill Breakdown"
              subtitle="Detailed competence ratings derived from question evaluations."
            />
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-16)" }}>
              {skillBreakdown.map((s, i) => (
                <ProgressBar
                  key={i}
                  label={s.skill}
                  value={s.score}
                  variant={i === 0 ? "primary" : "secondary"}
                  height={8}
                />
              ))}
            </div>
          </Card>
        </div>

        {/* Milestone Summary */}
        <div className="col-6">
          <Card style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <CardHeader
                title="Interview Summary"
                subtitle="Milestone performance statistics across your training."
              />
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "10px", borderBottom: "1px solid var(--border-subtle)" }}>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>Completed Sessions</span>
                  <span style={{ fontWeight: 700, color: "var(--text-main)" }}>{completedSessions}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "10px", borderBottom: "1px solid var(--border-subtle)" }}>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>Peak Score</span>
                  <span style={{ fontWeight: 700, color: "var(--primary)" }}>{stats?.highest_score ? `${stats.highest_score}%` : "—"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "10px", borderBottom: "1px solid var(--border-subtle)" }}>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>Strongest Dimension</span>
                  <span style={{ fontWeight: 700, color: "var(--text-main)" }}>{stats?.strongest_dimension || "—"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>Area for Growth</span>
                  <span style={{ fontWeight: 700, color: "var(--text-main)" }}>{stats?.weakest_dimension || "—"}</span>
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: "var(--sp-24)",
                padding: "14px 18px",
                borderRadius: "var(--r-md)",
                backgroundColor: "var(--surface-muted)",
                border: "1px solid var(--border-subtle)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Flame size={18} color="var(--primary)" />
                <div>
                  <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--text-main)" }}>
                    Practice Milestone
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                    {completedSessions} session{completedSessions !== 1 ? "s" : ""} completed towards placement readiness.
                  </div>
                </div>
              </div>
              <Badge variant={completedSessions > 0 ? "completed" : "pending"}>
                {completedSessions >= 3 ? "Active" : "Beginner"}
              </Badge>
            </div>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
