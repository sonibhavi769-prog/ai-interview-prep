/**
 * Onboarding — select target job role and technical domain.
 * Shown once after first signup; also reachable from Dashboard settings.
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";

export default function Onboarding() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [roles, setRoles] = useState([]);
  const [domains, setDomains] = useState([]);
  const [form, setForm] = useState({
    role: user?.role || "",
    domain: user?.domain || "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  /* Fetch available options */
  useEffect(() => {
    api.get("/users/me/options").then(({ data }) => {
      setRoles(data.roles);
      setDomains(data.domains);
    });
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.role || !form.domain) {
      setError("Please select both a role and a domain.");
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.put("/users/me/profile", form);
      updateUser(data.user);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page-center">
      <div className="auth-card card-glass animate-in" style={{ maxWidth: 520 }}>
        <h1>Set up your profile</h1>
        <p>
          Tell us what you're preparing for — we'll tailor every interview to
          match.
        </p>

        {error && (
          <div className="badge badge-error" style={{ marginBottom: "var(--sp-md)", width: "100%", justifyContent: "center", padding: "0.6rem" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="onboard-role">
              Target job role
            </label>
            <select
              id="onboard-role"
              className="form-select"
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
            >
              <option value="">Select a role…</option>
              {roles.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginTop: "var(--sp-md)" }}>
            <label className="form-label" htmlFor="onboard-domain">
              Technical domain
            </label>
            <select
              id="onboard-domain"
              className="form-select"
              value={form.domain}
              onChange={(e) => setForm((f) => ({ ...f, domain: e.target.value }))}
            >
              <option value="">Select a domain…</option>
              {domains.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
            style={{ marginTop: "var(--sp-xl)" }}
          >
            {submitting ? "Saving…" : "Continue to Dashboard →"}
          </button>
        </form>
      </div>
    </div>
  );
}
