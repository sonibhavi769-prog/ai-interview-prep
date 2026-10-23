/**
 * Sign-up page with inline validation.
 */
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  /* ── Validation ──────────────────────────────────────────────── */
  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Enter a valid email address";

    if (!form.password) e.password = "Password is required";
    else {
      if (form.password.length < 8) e.password = "At least 8 characters";
      else if (!/[A-Z]/.test(form.password))
        e.password = "Include at least one uppercase letter";
      else if (!/[0-9]/.test(form.password))
        e.password = "Include at least one digit";
    }

    if (form.password && form.confirm !== form.password)
      e.confirm = "Passwords don't match";

    return e;
  }

  /* ── Submit ──────────────────────────────────────────────────── */
  async function handleSubmit(e) {
    e.preventDefault();
    setServerError("");
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length) return;

    setSubmitting(true);
    try {
      await signup(form.name, form.email, form.password);
      navigate("/onboarding");
    } catch (err) {
      setServerError(
        err.response?.data?.error || "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleChange(field) {
    return (e) => {
      setForm((f) => ({ ...f, [field]: e.target.value }));
      setErrors((prev) => ({ ...prev, [field]: undefined }));
      setServerError("");
    };
  }

  return (
    <div className="page-center">
      <div className="auth-card card-glass animate-in">
        <h1>Create your account</h1>
        <p>Start practising interviews in minutes.</p>

        {serverError && (
          <div className="badge badge-error" style={{ marginBottom: "var(--sp-md)", width: "100%", justifyContent: "center", padding: "0.6rem" }}>
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="signup-name">Full name</label>
            <input
              id="signup-name"
              className="form-input"
              type="text"
              placeholder="Jane Doe"
              value={form.name}
              onChange={handleChange("name")}
              autoFocus
            />
            <span className="form-error">{errors.name || ""}</span>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="signup-email">Email</label>
            <input
              id="signup-email"
              className="form-input"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange("email")}
            />
            <span className="form-error">{errors.email || ""}</span>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="signup-password">Password</label>
            <input
              id="signup-password"
              className="form-input"
              type="password"
              placeholder="Min 8 chars, 1 uppercase, 1 digit"
              value={form.password}
              onChange={handleChange("password")}
            />
            <span className="form-error">{errors.password || ""}</span>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="signup-confirm">Confirm password</label>
            <input
              id="signup-confirm"
              className="form-input"
              type="password"
              placeholder="Re-enter password"
              value={form.confirm}
              onChange={handleChange("confirm")}
            />
            <span className="form-error">{errors.confirm || ""}</span>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
          >
            {submitting ? "Creating account…" : "Sign up"}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Log in</Link>
        </div>
      </div>
    </div>
  );
}
