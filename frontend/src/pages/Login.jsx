import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { ArrowRight, Eye, EyeOff, AlertCircle } from "lucide-react";

export default function Login() {
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const from = location.state?.from?.pathname || "/dashboard";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isSignUp) {
        if (!name.trim()) {
          throw new Error("Please enter your full name.");
        }
        await signup(name.trim(), email.trim(), password);
      } else {
        await login(email.trim(), password);
      }
      navigate(from, { replace: true });
    } catch (err) {
      setError(
        err?.response?.data?.error ||
        err.message ||
        "Authentication failed. Please verify your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = () => {
    setError("Google OAuth is not enabled for this installation. Please sign in with email and password.");
  };

  return (
    <div
      style={{
        minHeight: "calc(100vh - var(--nav-height) - 40px)",
        backgroundColor: "var(--bg-app)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
      }}
    >
      {/* ── Centered Auth Card ─────────────────────────────────────── */}
      <Card
        size="lg"
        style={{
          width: "100%",
          maxWidth: "460px",
          textAlign: "center",
          boxShadow: "var(--shadow-md)",
        }}
      >
        {/* Minimalist Logo */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", marginBottom: "var(--sp-20)" }}>
          <div className="brand-icon" style={{ width: "36px", height: "36px" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
              <circle cx="12" cy="12" r="9" />
              <circle cx="12" cy="12" r="4" />
            </svg>
          </div>
          <span className="brand-name" style={{ fontSize: "1.35rem" }}>
            Interview<span>AI</span>
          </span>
        </div>

        {/* Heading & Subtitle */}
        <h1
          style={{
            fontSize: "1.625rem",
            color: "var(--text-main)",
            marginBottom: "var(--sp-8)",
            lineHeight: 1.25,
          }}
        >
          {isSignUp ? "Create your candidate account" : "Sign in to InterviewAI"}
        </h1>
        <p
          style={{
            fontSize: "0.92rem",
            color: "var(--text-muted)",
            marginBottom: "var(--sp-24)",
            lineHeight: 1.55,
          }}
        >
          Practice with AI-powered mock interviews customized for your target career role.
        </p>

        {error && (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: "var(--r-md)",
              backgroundColor: "var(--surface)",
              border: "1px solid var(--primary-border)",
              color: "var(--primary)",
              fontSize: "0.86rem",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              textAlign: "left",
              marginBottom: "var(--sp-16)",
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ textAlign: "left" }}>
          {isSignUp && (
            <div className="form-group">
              <label className="form-label" htmlFor="auth-name">
                Full Name
              </label>
              <input
                id="auth-name"
                type="text"
                className="form-input"
                placeholder="e.g. Alex Morgan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          {/* Email */}
          <div className="form-group">
            <label className="form-label" htmlFor="auth-email">
              Email Address
            </label>
            <input
              id="auth-email"
              type="email"
              className="form-input"
              placeholder="candidate@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password */}
          <div className="form-group">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label className="form-label" htmlFor="auth-password">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "0.76rem",
                  color: "var(--primary)",
                  cursor: "pointer",
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <input
              id="auth-password"
              type={showPassword ? "text" : "password"}
              className="form-input"
              placeholder={isSignUp ? "At least 8 chars, 1 uppercase, 1 digit" : "••••••••"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Primary Submit Button */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            iconRight={ArrowRight}
            id="auth-primary-submit-btn"
            disabled={loading}
            style={{ marginTop: "var(--sp-8)", marginBottom: "var(--sp-16)" }}
          >
            {loading ? "Authenticating…" : isSignUp ? "Create Account" : "Sign In"}
          </Button>

          {/* Divider */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              margin: "18px 0",
            }}
          >
            <div style={{ height: "1px", flex: 1, backgroundColor: "var(--border-subtle)" }} />
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>or</span>
            <div style={{ height: "1px", flex: 1, backgroundColor: "var(--border-subtle)" }} />
          </div>

          {/* Secondary Button: Continue with Google */}
          <Button
            type="button"
            variant="outline"
            size="lg"
            fullWidth
            onClick={handleGoogleAuth}
            id="continue-with-google-btn"
            style={{ marginBottom: "var(--sp-16)" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ marginRight: "6px" }}>
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="var(--primary)"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="var(--secondary)"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                fill="var(--primary-hover)"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                fill="var(--secondary-hover)"
              />
            </svg>
            Continue with Google
          </Button>
        </form>

        {/* Footer Toggle */}
        <div style={{ fontSize: "0.88rem", color: "var(--text-muted)", marginTop: "var(--sp-12)" }}>
          {isSignUp ? (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(false);
                  setError(null);
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--primary)",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Sign In
              </button>
            </>
          ) : (
            <>
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(true);
                  setError(null);
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--primary)",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Create one
              </button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
