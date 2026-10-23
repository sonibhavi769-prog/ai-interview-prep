import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { progressApi } from "../services/progressApi";
import PageContainer, { PageHeader } from "../components/ui/PageContainer";
import StatCard from "../components/ui/StatCard";
import Card, { CardHeader } from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import ProgressBar from "../components/ui/ProgressBar";
import EmptyState from "../components/ui/EmptyState";
import { Play, ArrowRight, Edit3, Award, AlertCircle, RefreshCw } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState([]);
  const [recentInterviews, setRecentInterviews] = useState([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, trendsRes, historyRes] = await Promise.all([
        progressApi.getStats(),
        progressApi.getTrends(),
        progressApi.getHistory(),
      ]);
      setStats(statsRes.stats);
      setTrends(trendsRes.trends || []);
      setRecentInterviews((historyRes.history || []).slice(0, 5));
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // SVG Chart Geometry for Trends
  const chartWidth = 720;
  const chartHeight = 220;
  const paddingX = 64;
  const paddingY = 40;
  const usableWidth = chartWidth - paddingX * 2;
  const usableHeight = chartHeight - paddingY * 2;
  const minScore = 0;
  const maxScore = 100;

  const pointsSvg =
    trends.length > 0
      ? trends.map((pt, idx) => {
          const x =
            trends.length === 1
              ? chartWidth / 2
              : paddingX + (idx / (trends.length - 1)) * usableWidth;
          const y =
            chartHeight -
            paddingY -
            ((pt.overall_score - minScore) / (maxScore - minScore)) * usableHeight;
          return { ...pt, x, y };
        })
      : [];

  const polylineStr = pointsSvg.map((p) => `${p.x},${p.y}`).join(" ");

  if (loading) {
    return (
      <PageContainer>
        <PageHeader
          title={`Hi, ${user?.name || "there"} 👋`}
          subtitle="Loading your personalized dashboard and interview metrics..."
        />
        <div className="stats-grid" style={{ marginBottom: "var(--sp-32)" }}>
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} style={{ padding: "24px", minHeight: "130px", opacity: 0.6 }}>
              <div style={{ height: "14px", width: "45%", backgroundColor: "var(--border-subtle)", borderRadius: "4px", marginBottom: "16px" }} />
              <div style={{ height: "32px", width: "60%", backgroundColor: "var(--border-subtle)", borderRadius: "6px" }} />
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
          title={`Hi, ${user?.name || "there"} 👋`}
          subtitle="Track your interview progress, evaluate your readiness, and improve your performance."
        />
        <Card style={{ padding: "32px", textAlign: "center", border: "1px solid var(--border-subtle)" }}>
          <AlertCircle size={40} color="var(--primary)" style={{ margin: "0 auto 16px" }} />
          <h3 style={{ fontSize: "1.2rem", color: "var(--text-main)", marginBottom: "8px" }}>
            Could not load dashboard data
          </h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", maxWidth: "480px", margin: "0 auto 20px" }}>
            {error}
          </p>
          <Button variant="primary" icon={RefreshCw} onClick={fetchData}>
            Retry
          </Button>
        </Card>
      </PageContainer>
    );
  }

  const totalSessions = stats?.total_sessions || 0;
  const completedSessions = stats?.completed_sessions || 0;
  const avgScore = stats?.average_score ? `${stats.average_score}%` : "—";
  const highestScore = stats?.highest_score ? `${stats.highest_score}%` : "—";
  const strongestDim = stats?.strongest_dimension || "—";

  const techAvg = stats?.dimension_averages?.["Technical Accuracy"] || 0;
  const commAvg = stats?.dimension_averages?.["Communication"] || 0;
  const confAvg = stats?.dimension_averages?.["Confidence"] || 0;

  return (
    <PageContainer>
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <PageHeader
        title={`Hi, ${user?.name || "there"} 👋`}
        subtitle="Track your interview progress, evaluate your readiness, and improve your performance."
        action={
          <Button
            variant="primary"
            size="lg"
            icon={Play}
            onClick={() => navigate("/practice")}
            id="start-mock-interview-cta"
          >
            Start Mock Interview
          </Button>
        }
      />

      {/* ── 4 Metric Cards ──────────────────────────────────────────── */}
      <div className="stats-grid" style={{ marginBottom: "var(--sp-32)" }}>
        <StatCard
          title="Total Interviews"
          value={totalSessions}
          footer={`${completedSessions} completed sessions`}
        />
        <StatCard
          title="Average Score"
          value={avgScore}
          footer={totalSessions > 0 ? "Across evaluated sessions" : "No evaluations yet"}
        />
        <StatCard
          title="Best Score"
          value={highestScore}
          footer={totalSessions > 0 ? "Peak performance" : "Awaiting first session"}
        />
        <StatCard
          title="Strongest Dimension"
          value={strongestDim}
          valueStyle={{ fontSize: "1.45rem", lineHeight: 1.25 }}
          footer={totalSessions > 0 ? "Top scoring skill" : "Evaluated on completion"}
        />
      </div>

      {/* ── Two-Column Layout: Your Profile & Performance Overview ───── */}
      <div className="grid-12" style={{ marginBottom: "var(--sp-32)" }}>
        {/* Left: Your Profile Card */}
        <div className="col-6">
          <Card style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <CardHeader
                title="Your Target Profile"
                action={
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Edit3}
                    onClick={() => navigate("/profile")}
                    id="edit-profile-btn"
                  >
                    Edit Profile
                  </Button>
                }
              />
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-16)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "12px", borderBottom: "1px solid var(--border-subtle)" }}>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>Target Role</span>
                  <span style={{ fontWeight: 600, color: "var(--text-main)", fontSize: "0.92rem" }}>
                    {user?.role || "Not specified"}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "12px", borderBottom: "1px solid var(--border-subtle)" }}>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>Technical Domain</span>
                  <span style={{ fontWeight: 600, color: "var(--text-main)", fontSize: "0.92rem" }}>
                    {user?.domain || "Not specified"}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "12px", borderBottom: "1px solid var(--border-subtle)" }}>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>Candidate Name</span>
                  <span style={{ fontWeight: 600, color: "var(--text-main)", fontSize: "0.92rem" }}>
                    {user?.name || "User"}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>Email</span>
                  <span style={{ fontWeight: 600, color: "var(--text-main)", fontSize: "0.92rem" }}>
                    {user?.email || "—"}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right: Performance Overview Card */}
        <div className="col-6">
          <Card style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <CardHeader title="Performance Overview" subtitle="Calculated from your evaluated responses" />
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-20)" }}>
                <ProgressBar label="Technical Accuracy" value={techAvg} height={9} />
                <ProgressBar label="Communication" value={commAvg} height={9} />
                <ProgressBar label="Confidence" value={confAvg} height={9} />
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
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Award size={18} color="var(--primary)" />
                <span style={{ fontSize: "0.86rem", color: "var(--text-body)", fontWeight: 500 }}>Readiness Index</span>
              </div>
              <Badge variant={completedSessions > 0 ? "completed" : "pending"}>
                {completedSessions >= 3 ? "Interview Ready" : completedSessions > 0 ? "In Progress" : "Get Started"}
              </Badge>
            </div>
          </Card>
        </div>
      </div>

      {/* ── Score Trajectory (Minimalist Line Chart) ─────────────────── */}
      <Card style={{ marginBottom: "var(--sp-32)" }}>
        <CardHeader
          title="Score Trajectory"
          subtitle="Track your improvement across successive mock interviews."
        />
        {trends.length < 2 ? (
          <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-muted)" }}>
            <p style={{ fontSize: "0.95rem", marginBottom: "8px" }}>
              {trends.length === 1
                ? "You have 1 evaluated session. Complete another mock interview to visualize your score progression."
                : "No interview trajectory yet. Complete your first mock interview to begin tracking performance."}
            </p>
          </div>
        ) : (
          <div className="chart-wrapper">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="line-chart-svg">
              {[20, 40, 60, 80, 100].map((score) => {
                const y = chartHeight - paddingY - ((score - minScore) / (maxScore - minScore)) * usableHeight;
                return (
                  <g key={score}>
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
                      x={paddingX - 12}
                      y={y + 4}
                      fill="var(--text-muted)"
                      fontSize="11"
                      textAnchor="end"
                      fontFamily="var(--font-body)"
                    >
                      {score}%
                    </text>
                  </g>
                );
              })}

              <polyline
                fill="none"
                stroke="var(--primary)"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={polylineStr}
              />

              {pointsSvg.map((p, i) => (
                <g key={i}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="6"
                    fill="#FFFFFF"
                    stroke="var(--primary)"
                    strokeWidth="3"
                  />
                  <circle cx={p.x} cy={p.y} r="2.5" fill="var(--secondary)" />
                  <text
                    x={p.x}
                    y={p.y - 14}
                    fill="var(--primary)"
                    fontSize="12"
                    fontWeight="700"
                    textAnchor="middle"
                    fontFamily="var(--font-heading)"
                  >
                    {p.overall_score}%
                  </text>
                  <text
                    x={p.x}
                    y={chartHeight - 12}
                    fill="var(--text-muted)"
                    fontSize="11"
                    fontWeight="500"
                    textAnchor="middle"
                    fontFamily="var(--font-body)"
                  >
                    {p.date}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        )}
      </Card>

      {/* ── Recent Interviews Section ────────────────────────────────── */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-16)" }}>
          <h2 style={{ fontSize: "1.25rem", color: "var(--text-main)" }}>Recent Interviews</h2>
          {recentInterviews.length > 0 && (
            <Link
              to="/interviews"
              style={{
                fontSize: "0.88rem",
                fontWeight: 600,
                color: "var(--primary)",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              View All History <ArrowRight size={15} />
            </Link>
          )}
        </div>

        {recentInterviews.length === 0 ? (
          <EmptyState
            title="No Interviews Yet"
            description="You haven't completed any mock interviews yet. Start your first session to receive instant AI-powered feedback."
            actionLabel="Start Mock Interview"
            onAction={() => navigate("/practice")}
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-12)" }}>
            {recentInterviews.map((session) => (
              <Card
                key={session.session_id}
                style={{
                  padding: "20px 24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "18px",
                }}
              >
                {/* Left Details */}
                <div style={{ minWidth: "220px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                    <span style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--text-main)" }}>
                      {session.role}
                    </span>
                    <Badge variant={session.status === "completed" ? "completed" : "pending"}>
                      {session.status}
                    </Badge>
                  </div>
                  <div style={{ fontSize: "0.84rem", color: "var(--text-body)" }}>
                    {session.domain} • {session.interview_type}
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "4px" }}>
                    {session.created_at ? new Date(session.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : ""}
                  </div>
                </div>

                {/* Center Dimension Scores */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "28px",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>
                      Technical
                    </div>
                    <div style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--primary)", marginTop: "2px" }}>
                      {session.technical_accuracy != null ? `${session.technical_accuracy}%` : "—"}
                    </div>
                  </div>

                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>
                      Communication
                    </div>
                    <div style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--primary)", marginTop: "2px" }}>
                      {session.communication != null ? `${session.communication}%` : "—"}
                    </div>
                  </div>

                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>
                      Confidence
                    </div>
                    <div style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--primary)", marginTop: "2px" }}>
                      {session.confidence != null ? `${session.confidence}%` : "—"}
                    </div>
                  </div>

                  <div
                    style={{
                      textAlign: "center",
                      padding: "6px 16px",
                      borderRadius: "var(--r-md)",
                      backgroundColor: "var(--secondary-subtle)",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    <div style={{ fontSize: "0.7rem", color: "var(--text-body)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>
                      Overall
                    </div>
                    <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--primary)" }}>
                      {session.overall_score != null ? `${session.overall_score}%` : "—"}
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div>
                  <Button
                    variant="outline"
                    size="sm"
                    iconRight={ArrowRight}
                    onClick={() => navigate(`/interview/${session.session_id}/results`)}
                    id={`view-results-${session.session_id}`}
                  >
                    View Results
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
