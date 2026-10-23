import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { interviewApi } from "../services/interviewApi";
import { userApi } from "../services/userApi";
import PageContainer from "../components/ui/PageContainer";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import SegmentedControl from "../components/ui/SegmentedControl";
import { ArrowRight, Sparkles, AlertCircle } from "lucide-react";

export default function InterviewSetup() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState(user?.role || "Software Engineer");
  const [domain, setDomain] = useState(user?.domain || "Backend Development");
  const [interviewType, setInterviewType] = useState("Mixed"); // Technical | Behavioral | Mixed
  const [questionCount, setQuestionCount] = useState(5); // 5 - 20 (default 5 for quick & responsive testing)
  const [difficulty, setDifficulty] = useState("Medium");
  const [experienceLevel, setExperienceLevel] = useState("Junior");
  const [duration, setDuration] = useState("30 min");

  const [options, setOptions] = useState({ roles: [], domains: [] });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await userApi.getOptions();
        if (data.roles?.length) setOptions({ roles: data.roles, domains: data.domains || [] });
      } catch {
        /* fallback options */
      }
    })();
  }, []);

  useEffect(() => {
    if (user?.role) setRole(user.role);
    if (user?.domain) setDomain(user.domain);
  }, [user]);

  const handleStart = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const res = await interviewApi.create({
        role,
        domain,
        interview_type: interviewType,
        total_questions: Number(questionCount),
      });

      if (res?.session_id) {
        navigate(`/interview/${res.session_id}`);
      } else {
        throw new Error("No session ID returned from backend.");
      }
    } catch (err) {
      setError(
        err?.response?.data?.error ||
        err.message ||
        "Failed to generate questions. AI provider is experiencing high traffic. Please retry in a moment."
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <PageContainer maxWidth={780}>
      {/* ── Page Header (Centered) ─────────────────────────────────── */}
      <div style={{ textAlign: "center", marginBottom: "var(--sp-32)" }}>
        <h1 style={{ fontSize: "2rem", color: "var(--text-main)", marginBottom: "var(--sp-8)" }}>
          Configure Your Interview
        </h1>
        <p style={{ fontSize: "0.95rem", color: "var(--text-muted)", maxWidth: "520px", margin: "0 auto" }}>
          Customize your mock interview parameters or continue with recommended settings.
        </p>
      </div>

      {error && (
        <Card style={{ padding: "16px 20px", marginBottom: "var(--sp-20)", backgroundColor: "var(--surface)", border: "1px solid var(--primary-border)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
            <AlertCircle size={20} color="var(--primary)" style={{ flexShrink: 0, marginTop: "2px" }} />
            <div>
              <div style={{ fontWeight: 600, color: "var(--primary)", fontSize: "0.92rem", marginBottom: "4px" }}>
                Session Creation Error
              </div>
              <div style={{ color: "var(--text-muted)", fontSize: "0.86rem" }}>{error}</div>
            </div>
          </div>
        </Card>
      )}

      {/* ── Centered Configuration Card (32px padding) ─────────────── */}
      <Card size="lg">
        <form onSubmit={handleStart}>
          {/* Target Role */}
          <div className="form-group">
            <label className="form-label" htmlFor="config-target-role">
              Target Role
            </label>
            <select
              id="config-target-role"
              className="form-select"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={creating}
            >
              {options.roles.length > 0 ? (
                options.roles.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))
              ) : (
                <>
                  <option value="Software Engineer">Software Engineer</option>
                  <option value="Frontend Developer">Frontend Developer</option>
                  <option value="Backend Developer">Backend Developer</option>
                  <option value="Full Stack Developer">Full Stack Developer</option>
                  <option value="DevOps Engineer">DevOps Engineer</option>
                  <option value="Data Scientist">Data Scientist</option>
                </>
              )}
            </select>
          </div>

          {/* Domain */}
          <div className="form-group">
            <label className="form-label" htmlFor="config-domain">
              Domain
            </label>
            <select
              id="config-domain"
              className="form-select"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              disabled={creating}
            >
              {options.domains.length > 0 ? (
                options.domains.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))
              ) : (
                <>
                  <option value="Backend Development">Backend Development</option>
                  <option value="Frontend Development">Frontend Development</option>
                  <option value="Full Stack Development">Full Stack Development</option>
                  <option value="Cloud Computing">Cloud Computing</option>
                  <option value="DevOps & CI/CD">DevOps & CI/CD</option>
                  <option value="System Design">System Design</option>
                  <option value="General HR">General HR</option>
                </>
              )}
            </select>
          </div>

          {/* Interview Type Segmented Control */}
          <div className="form-group" style={{ marginTop: "var(--sp-24)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "var(--sp-8)" }}>
              <label className="form-label">Interview Type</label>
              <span className="form-label-muted">Select format focus</span>
            </div>
            <SegmentedControl
              id="interview-type-segmented"
              options={["Technical", "HR", "Mixed"]}
              value={interviewType}
              onChange={setInterviewType}
            />
          </div>

          {/* Number of Questions Slider */}
          <div className="form-group slider-container" style={{ marginTop: "var(--sp-28)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label className="form-label" htmlFor="question-count-slider">
                Number of Questions
              </label>
              <span
                style={{
                  fontFamily: "var(--font-heading)",
                  fontWeight: 700,
                  fontSize: "0.88rem",
                  color: "var(--primary)",
                  padding: "4px 12px",
                  borderRadius: "var(--r-pill)",
                  backgroundColor: "var(--primary-subtle)",
                  border: "1px solid var(--primary-border)",
                }}
              >
                {questionCount} Questions
              </span>
            </div>

            <input
              type="range"
              id="question-count-slider"
              className="custom-range"
              min="5"
              max="20"
              step="1"
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
              disabled={creating}
            />

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-muted)" }}>
              <span>5 Questions (Quick)</span>
              <span>10 Questions (Standard)</span>
              <span>20 Questions (In-depth)</span>
            </div>
          </div>

          {/* Optional Settings Section Divider */}
          <div
            style={{
              margin: "var(--sp-32) 0 var(--sp-24)",
              display: "flex",
              alignItems: "center",
              gap: "var(--sp-12)",
            }}
          >
            <div style={{ height: "1px", flex: 1, backgroundColor: "var(--border-subtle)" }} />
            <span style={{ fontSize: "0.76rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Interview Settings
            </span>
            <div style={{ height: "1px", flex: 1, backgroundColor: "var(--border-subtle)" }} />
          </div>

          {/* Difficulty Segmented */}
          <div className="form-group">
            <label className="form-label">Difficulty</label>
            <SegmentedControl
              options={["Easy", "Medium", "Hard"]}
              value={difficulty}
              onChange={setDifficulty}
            />
          </div>

          {/* Experience Level Segmented */}
          <div className="form-group" style={{ marginTop: "var(--sp-20)" }}>
            <label className="form-label">Experience Level</label>
            <SegmentedControl
              options={["Fresher", "Junior", "Mid-Level", "Senior"]}
              value={experienceLevel}
              onChange={setExperienceLevel}
            />
          </div>

          {/* Interview Duration Segmented */}
          <div className="form-group" style={{ marginTop: "var(--sp-20)", marginBottom: "var(--sp-32)" }}>
            <label className="form-label">Interview Duration</label>
            <SegmentedControl
              options={["15 min", "30 min", "45 min"]}
              value={duration}
              onChange={setDuration}
            />
          </div>

          {/* Primary CTA Button */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            iconRight={creating ? Sparkles : ArrowRight}
            disabled={creating}
            id="start-interview-submit-btn"
          >
            {creating ? "Generating Questions with AI..." : "Start Interview"}
          </Button>
        </form>
      </Card>
    </PageContainer>
  );
}
