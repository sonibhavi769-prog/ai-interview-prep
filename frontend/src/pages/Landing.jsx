/**
 * Landing page — hero section with pitch and CTA buttons.
 */
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="landing">
      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="landing__hero">
        <div className="container">
          <div className="landing__hero-content animate-in">
            <div className="landing__badge badge badge-primary">
              ✨ AI-Powered Interview Preparation
            </div>
            <h1 className="landing__title">
              Ace Your Next Interview with{" "}
              <span className="landing__gradient-text">Confidence</span>
            </h1>
            <p className="landing__subtitle">
              Practice with AI-generated questions tailored to your role and domain.
              From conversational rounds to hands-on coding tasks — experience
              realistic mock interviews that prepare you for the real thing.
            </p>
            <div className="landing__ctas">
              {user ? (
                <Link to="/dashboard" className="btn btn-primary btn-lg">
                  Go to Dashboard →
                </Link>
              ) : (
                <>
                  <Link to="/signup" className="btn btn-primary btn-lg">
                    Get Started Free
                  </Link>
                  <Link to="/login" className="btn btn-secondary btn-lg">
                    Log In
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* decorative background blobs */}
        <div className="landing__blob landing__blob--1" />
        <div className="landing__blob landing__blob--2" />
      </section>

      {/* ── Features ──────────────────────────────────────────── */}
      <section className="landing__features">
        <div className="container">
          <div className="landing__features-grid stagger">
            {[
              {
                icon: "🎯",
                title: "Role-Specific Questions",
                desc: "AI generates questions matched to your target role and technical domain — no generic fluff.",
              },
              {
                icon: "💻",
                title: "Coding Tasks Included",
                desc: "Technical interviews aren't just Q&A. Practice real coding challenges alongside conversational rounds.",
              },
              {
                icon: "🎤",
                title: "Voice Support (Coming Soon)",
                desc: "Speak your answers naturally with upcoming speech-to-text integration for a realistic experience.",
              },
              {
                icon: "📊",
                title: "Track Your Progress",
                desc: "Review past sessions, identify weak areas, and improve systematically with detailed reports.",
              },
            ].map((f) => (
              <div key={f.title} className="card-glass landing__feature-card animate-in">
                <div className="landing__feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── inline styles (scoped to this page) ───────────────── */}
      <style>{`
        .landing__hero {
          position: relative;
          overflow: hidden;
          padding: var(--sp-3xl) 0;
          min-height: 80vh;
          display: flex;
          align-items: center;
        }
        .landing__hero-content {
          max-width: 700px;
          margin: 0 auto;
          text-align: center;
        }
        .landing__badge {
          margin-bottom: var(--sp-lg);
        }
        .landing__title {
          font-size: var(--fs-hero);
          font-weight: 800;
          line-height: 1.1;
          margin-bottom: var(--sp-lg);
        }
        .landing__gradient-text {
          background: linear-gradient(135deg, var(--clr-primary), var(--clr-secondary));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .landing__subtitle {
          font-size: var(--fs-lg);
          color: var(--clr-text-secondary);
          margin-bottom: var(--sp-2xl);
          line-height: 1.7;
        }
        .landing__ctas {
          display: flex;
          gap: var(--sp-md);
          justify-content: center;
          flex-wrap: wrap;
        }

        /* decorative blobs */
        .landing__blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(120px);
          opacity: 0.25;
          pointer-events: none;
        }
        .landing__blob--1 {
          width: 500px; height: 500px;
          background: var(--clr-primary);
          top: -100px; right: -100px;
        }
        .landing__blob--2 {
          width: 400px; height: 400px;
          background: var(--clr-secondary);
          bottom: -80px; left: -80px;
        }

        /* features */
        .landing__features {
          padding: var(--sp-3xl) 0;
        }
        .landing__features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: var(--sp-xl);
        }
        .landing__feature-card {
          text-align: center;
          padding: var(--sp-2xl) var(--sp-xl);
        }
        .landing__feature-card h3 {
          margin: var(--sp-md) 0 var(--sp-sm);
          font-size: var(--fs-lg);
        }
        .landing__feature-card p {
          color: var(--clr-text-secondary);
          font-size: var(--fs-sm);
          line-height: 1.6;
        }
        .landing__feature-icon {
          font-size: 2.5rem;
        }
      `}</style>
    </div>
  );
}
