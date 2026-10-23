/**
 * Session Complete — confirmation screen after finishing or abandoning.
 * No scores or feedback — that's the other workstream's scope.
 */
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";

export default function SessionComplete() {
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/interviews/${sessionId}`);
        setSession(data.session);
      } catch {
        /* silently fall through — show generic complete message */
      } finally {
        setLoading(false);
      }
    })();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Loading results…</p>
      </div>
    );
  }

  const completed = session?.status === "completed";
  const totalQ = session?.questions?.length || 0;
  const answered = session?.responses?.length || 0;

  return (
    <div className="page-center">
      <div
        className="card-glass animate-in"
        style={{
          maxWidth: 520,
          textAlign: "center",
          padding: "var(--sp-3xl) var(--sp-2xl)",
        }}
      >
        <div style={{ fontSize: "4rem", marginBottom: "var(--sp-lg)" }}>
          {completed ? "🎉" : "⏹️"}
        </div>

        <h1 style={{ fontSize: "var(--fs-3xl)", marginBottom: "var(--sp-sm)" }}>
          {completed ? "Interview Complete!" : "Interview Ended Early"}
        </h1>

        <p
          style={{
            color: "var(--clr-text-secondary)",
            marginBottom: "var(--sp-xl)",
            lineHeight: 1.7,
          }}
        >
          {completed
            ? `You answered all ${totalQ} questions. Great job!`
            : `You answered ${answered} of ${totalQ} questions. Your partial responses have been saved.`}
        </p>

        <div
          style={{
            display: "flex",
            gap: "var(--sp-md)",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          {session && (
            <div
              style={{
                display: "flex",
                gap: "var(--sp-sm)",
                flexWrap: "wrap",
                justifyContent: "center",
                marginBottom: "var(--sp-lg)",
              }}
            >
              <span className="badge badge-primary">{session.role}</span>
              <span className="badge badge-secondary">{session.domain}</span>
              <span className="badge badge-muted">{session.interview_type}</span>
              <span className={`badge ${completed ? "badge-success" : "badge-warning"}`}>
                {completed ? "Completed" : "Abandoned"}
              </span>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: "var(--sp-md)", justifyContent: "center", flexWrap: "wrap", marginTop: "var(--sp-xl)" }}>
          <Link to={`/interview/${sessionId}/results`} className="btn btn-primary btn-lg">
            View Evaluation Results 📊
          </Link>
          <Link to="/dashboard" className="btn btn-secondary btn-lg">
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
