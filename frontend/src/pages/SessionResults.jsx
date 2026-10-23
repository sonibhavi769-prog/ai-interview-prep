import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { interviewApi } from "../services/interviewApi";
import PageContainer, { PageHeader } from "../components/ui/PageContainer";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import ProgressBar from "../components/ui/ProgressBar";
import { CheckCircle2, AlertCircle, ArrowRight, RotateCcw, Home, RefreshCw } from "lucide-react";

export default function SessionResults() {
  const navigate = useNavigate();
  const { sessionId } = useParams();

  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState(null);
  const [session, setSession] = useState(null);
  const [evaluation, setEvaluation] = useState(null);

  const fetchResults = useCallback(async () => {
    if (!sessionId) {
      setError("No session ID specified.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await interviewApi.getResults(sessionId);
      setSession(data.session);
      setEvaluation(data.evaluation);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "Failed to load interview results.");
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const handleRetryEval = async () => {
    setRetrying(true);
    try {
      const res = await interviewApi.retryEvaluation(sessionId);
      setSession(res.session);
      setEvaluation(res.evaluation);
    } catch (err) {
      alert(err?.response?.data?.error || "Retry failed. Provider may still be busy.");
    } finally {
      setRetrying(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <PageHeader title="Interview Results" subtitle="Loading your evaluation report..." />
        <Card style={{ padding: "48px", textAlign: "center" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              margin: "0 auto 16px",
              borderRadius: "50%",
              border: "3px solid var(--border-subtle)",
              borderTopColor: "var(--primary)",
              animation: "spin 1s linear infinite",
            }}
          />
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          <div style={{ color: "var(--text-muted)" }}>Evaluating interview responses...</div>
        </Card>
      </PageContainer>
    );
  }

  if (error || !session) {
    return (
      <PageContainer>
        <PageHeader title="Interview Results" subtitle="Detailed diagnostic report." />
        <Card style={{ padding: "32px", textAlign: "center" }}>
          <AlertCircle size={40} color="var(--primary)" style={{ margin: "0 auto 16px" }} />
          <h2 style={{ fontSize: "1.3rem", color: "var(--text-main)", marginBottom: "8px" }}>
            Session Not Found
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "24px" }}>
            {error || "We could not find the requested interview session."}
          </p>
          <Button variant="primary" onClick={() => navigate("/dashboard")}>
            Return to Dashboard
          </Button>
        </Card>
      </PageContainer>
    );
  }

  const isFailed = evaluation?.status === "failed";
  const aggregate = evaluation?.aggregate || {};
  const perQuestion = evaluation?.per_question || [];
  const recommendations = evaluation?.recommendations || [];

  const overallScore = aggregate.overall_score != null ? aggregate.overall_score : 0;
  const techScore = aggregate.technical_accuracy != null ? aggregate.technical_accuracy : 0;
  const commScore = aggregate.communication != null ? aggregate.communication : 0;
  const confScore = aggregate.confidence != null ? aggregate.confidence : 0;

  // Aggregate strengths and improvement areas across questions
  const allStrengths = [];
  const allImprovements = [];
  perQuestion.forEach((q) => {
    if (Array.isArray(q.strengths)) allStrengths.push(...q.strengths);
    if (Array.isArray(q.areas_for_improvement)) allImprovements.push(...q.areas_for_improvement);
  });
  const uniqueStrengths = Array.from(new Set(allStrengths)).slice(0, 4);
  const uniqueImprovements = Array.from(new Set(allImprovements)).slice(0, 4);

  const getCandidateTier = (score) => {
    if (score >= 85) return { label: "Exceptional Candidate Fit", desc: "Your answers demonstrated deep technical insight and clear articulation." };
    if (score >= 70) return { label: "Strong Candidate Fit", desc: "Solid foundational knowledge with good problem-solving communication." };
    if (score >= 50) return { label: "Developing Readiness", desc: "Good initial attempts. Focus on deepening technical depth and structured framing." };
    return { label: "Needs Practice", desc: "Spend focused rehearsal time on foundational concepts and communication clarity." };
  };

  const tier = getCandidateTier(overallScore);

  return (
    <PageContainer>
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <PageHeader
        badge={
          <Badge variant={session.status === "completed" ? "completed" : "pending"}>
            {session.status === "completed" ? "Completed Session" : "Abandoned Session"} • {session.role}
          </Badge>
        }
        title="Interview Results"
        subtitle={`Evaluation for ${session.role} (${session.domain})`}
        action={
          <>
            <Button
              variant="outline"
              size="md"
              icon={Home}
              onClick={() => navigate("/dashboard")}
            >
              Back to Dashboard
            </Button>
            <Button
              variant="primary"
              size="md"
              icon={RotateCcw}
              onClick={() => navigate("/practice")}
              id="retake-interview-btn"
            >
              Practice Another Role
            </Button>
          </>
        }
      />

      {/* ── Evaluation Provider Error Banner ─────────────────────────── */}
      {isFailed && (
        <Card style={{ padding: "24px", marginBottom: "var(--sp-24)", border: "1px solid var(--primary-border)", backgroundColor: "var(--surface)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
            <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
              <AlertCircle size={24} color="var(--primary)" style={{ flexShrink: 0, marginTop: "2px" }} />
              <div>
                <h3 style={{ fontSize: "1.05rem", color: "var(--primary)", marginBottom: "4px" }}>
                  AI Evaluation Temporarily Unavailable
                </h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", margin: 0, maxWidth: "600px" }}>
                  Your answers have been securely recorded. The AI evaluation service is currently experiencing high load. You can retry the evaluation now without retaking the session.
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              size="sm"
              icon={RefreshCw}
              onClick={handleRetryEval}
              disabled={retrying}
            >
              {retrying ? "Retrying Evaluation..." : "Retry Evaluation"}
            </Button>
          </div>
        </Card>
      )}

      {/* ── Overall Score Hero Card ──────────────────────────────────── */}
      <Card size="lg" style={{ marginBottom: "var(--sp-32)" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "var(--sp-32)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-32)", flexWrap: "wrap" }}>
            {/* Radial Score Ring */}
            <div
              style={{
                width: "120px",
                height: "120px",
                borderRadius: "50%",
                backgroundColor: "var(--secondary-subtle)",
                border: "4px solid var(--secondary)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "2.5rem",
                  fontWeight: 800,
                  color: "var(--primary)",
                  lineHeight: 1,
                }}
              >
                {isFailed ? "—" : `${overallScore}%`}
              </span>
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", marginTop: "2px" }}>
                Overall
              </span>
            </div>

            <div>
              <div
                style={{
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  color: "var(--secondary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: "4px",
                }}
              >
                Candidate Assessment
              </div>
              <h2 style={{ fontSize: "1.75rem", color: "var(--text-main)", marginBottom: "6px" }}>
                {isFailed ? "Evaluation Pending" : tier.label}
              </h2>
              <p style={{ fontSize: "0.9375rem", color: "var(--text-muted)", maxWidth: "540px", lineHeight: 1.6 }}>
                {isFailed
                  ? "Click Retry Evaluation above to generate detailed feedback from your answers."
                  : tier.desc}
              </p>
            </div>
          </div>

          <div
            style={{
              padding: "16px 24px",
              borderRadius: "var(--r-md)",
              backgroundColor: "var(--surface-muted)",
              border: "1px solid var(--border-subtle)",
              textAlign: "right",
            }}
          >
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600 }}>Questions Answered</div>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--primary)" }}>
              {session.responses?.length || 0} / {session.questions?.length || 0}
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-body)" }}>{session.domain}</div>
          </div>
        </div>
      </Card>

      {/* ── Three Metric Cards (Technical, Communication, Confidence) ─ */}
      <div className="grid-12" style={{ marginBottom: "var(--sp-40)" }}>
        <div className="col-4">
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-12)" }}>
              <span style={{ fontSize: "0.82rem", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.05em" }}>
                Technical Accuracy
              </span>
              <Badge variant="secondary">Core Skill</Badge>
            </div>
            <div style={{ fontSize: "2.25rem", fontWeight: 800, color: "var(--primary)", fontFamily: "var(--font-heading)", marginBottom: "var(--sp-8)" }}>
              {isFailed ? "—" : `${techScore}%`}
            </div>
            <ProgressBar value={techScore} height={8} style={{ marginBottom: "var(--sp-12)" }} />
            <p style={{ fontSize: "0.84rem", color: "var(--text-body)", margin: 0 }}>
              Accuracy of concepts, technical terms, and problem decomposition.
            </p>
          </Card>
        </div>

        <div className="col-4">
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-12)" }}>
              <span style={{ fontSize: "0.82rem", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.05em" }}>
                Communication
              </span>
              <Badge variant="primary">Articulation</Badge>
            </div>
            <div style={{ fontSize: "2.25rem", fontWeight: 800, color: "var(--primary)", fontFamily: "var(--font-heading)", marginBottom: "var(--sp-8)" }}>
              {isFailed ? "—" : `${commScore}%`}
            </div>
            <ProgressBar value={commScore} height={8} style={{ marginBottom: "var(--sp-12)" }} />
            <p style={{ fontSize: "0.84rem", color: "var(--text-body)", margin: 0 }}>
              Clarity of explanation, structure, and professional vocabulary.
            </p>
          </Card>
        </div>

        <div className="col-4">
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-12)" }}>
              <span style={{ fontSize: "0.82rem", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.05em" }}>
                Confidence
              </span>
              <Badge variant="neutral">Delivery</Badge>
            </div>
            <div style={{ fontSize: "2.25rem", fontWeight: 800, color: "var(--primary)", fontFamily: "var(--font-heading)", marginBottom: "var(--sp-8)" }}>
              {isFailed ? "—" : `${confScore}%`}
            </div>
            <ProgressBar value={confScore} height={8} style={{ marginBottom: "var(--sp-12)" }} />
            <p style={{ fontSize: "0.84rem", color: "var(--text-body)", margin: 0 }}>
              Decisiveness, directness of answer, and structured composure.
            </p>
          </Card>
        </div>
      </div>

      {/* ── AI Feedback (What You Did Well & Areas to Improve) ───────── */}
      {!isFailed && (uniqueStrengths.length > 0 || uniqueImprovements.length > 0) && (
        <>
          <div style={{ marginBottom: "var(--sp-20)" }}>
            <h2 style={{ fontSize: "1.375rem", color: "var(--text-main)" }}>AI Performance Insights</h2>
          </div>

          <div className="grid-12" style={{ marginBottom: "var(--sp-40)" }}>
            {/* What You Did Well */}
            <div className="col-6">
              <Card style={{ height: "100%" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "var(--sp-16)" }}>
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      backgroundColor: "var(--primary-subtle)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--primary)",
                    }}
                  >
                    <CheckCircle2 size={16} strokeWidth={2.5} />
                  </div>
                  <h3 style={{ fontSize: "1.125rem", color: "var(--text-main)" }}>What You Did Well</h3>
                </div>

                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "var(--sp-12)", padding: 0 }}>
                  {uniqueStrengths.length > 0 ? (
                    uniqueStrengths.map((str, i) => (
                      <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "0.9rem", color: "var(--text-body)" }}>
                        <span style={{ color: "var(--primary)", fontWeight: 700, marginTop: "2px" }}>•</span>
                        <span>{str}</span>
                      </li>
                    ))
                  ) : (
                    <li style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>Continue completing practice drills to generate identified strengths.</li>
                  )}
                </ul>
              </Card>
            </div>

            {/* Areas to Improve */}
            <div className="col-6">
              <Card style={{ height: "100%" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "var(--sp-16)" }}>
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      backgroundColor: "var(--secondary-subtle)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--primary)",
                    }}
                  >
                    <AlertCircle size={16} strokeWidth={2.5} />
                  </div>
                  <h3 style={{ fontSize: "1.125rem", color: "var(--text-main)" }}>Areas to Improve</h3>
                </div>

                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "var(--sp-12)", padding: 0 }}>
                  {uniqueImprovements.length > 0 ? (
                    uniqueImprovements.map((imp, i) => (
                      <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "0.9rem", color: "var(--text-body)" }}>
                        <span style={{ color: "var(--secondary)", fontWeight: 700, marginTop: "2px" }}>•</span>
                        <span>{imp}</span>
                      </li>
                    ))
                  ) : (
                    <li style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>No critical weaknesses flagged. Maintain consistency.</li>
                  )}
                </ul>
              </Card>
            </div>
          </div>
        </>
      )}

      {/* ── Per-Question Diagnostics ─────────────────────────────────── */}
      {perQuestion.length > 0 && (
        <div style={{ marginBottom: "var(--sp-40)" }}>
          <h2 style={{ fontSize: "1.375rem", color: "var(--text-main)", marginBottom: "var(--sp-16)" }}>
            Question-by-Question Evaluation
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {perQuestion.map((q, idx) => (
              <Card key={idx} style={{ padding: "20px 24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", marginBottom: "10px" }}>
                  <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-main)" }}>
                    Q{idx + 1}: {q.question_text}
                  </div>
                  <div style={{ display: "flex", gap: "12px", alignItems: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>Tech: <strong>{q.technical_accuracy}%</strong></span>
                    <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>Comm: <strong>{q.communication}%</strong></span>
                  </div>
                </div>
                {q.answer_text && (
                  <div style={{ fontSize: "0.85rem", color: "var(--text-body)", backgroundColor: "var(--surface-muted)", padding: "10px 14px", borderRadius: "var(--r-sm)", marginBottom: "12px" }}>
                    <strong>Your Response:</strong> {q.answer_text}
                  </div>
                )}
                {q.feedback && (
                  <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", margin: 0 }}>
                    <strong>AI Feedback:</strong> {q.feedback}
                  </p>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── Recommended Practice ────────────────────────────────────── */}
      {recommendations.length > 0 && (
        <div>
          <div style={{ marginBottom: "var(--sp-16)" }}>
            <h2 style={{ fontSize: "1.375rem", color: "var(--text-main)", marginBottom: "4px" }}>
              Recommended Practice
            </h2>
            <p style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
              Targeted modules curated from your session performance.
            </p>
          </div>

          <div className="grid-12">
            {recommendations.map((rec, i) => (
              <div key={i} className="col-4">
                <Card style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-12)" }}>
                      <Badge variant="secondary">{rec.domain || session.domain}</Badge>
                      <span style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>{rec.duration || "15 min drill"}</span>
                    </div>
                    <h4 style={{ fontSize: "1.05rem", color: "var(--text-main)", marginBottom: "var(--sp-8)" }}>
                      {rec.title}
                    </h4>
                    <p style={{ fontSize: "0.84rem", color: "var(--text-body)", lineHeight: 1.6 }}>
                      {rec.description}
                    </p>
                  </div>

                  <div style={{ marginTop: "var(--sp-20)", paddingTop: "var(--sp-16)", borderTop: "1px solid var(--border-subtle)" }}>
                    <Button
                      variant="outline"
                      size="sm"
                      fullWidth
                      iconRight={ArrowRight}
                      onClick={() => navigate("/practice")}
                      id={`practice-rec-${i + 1}`}
                    >
                      Practice Next Role
                    </Button>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}
    </PageContainer>
  );
}
