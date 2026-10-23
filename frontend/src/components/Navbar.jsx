import React, { useState, useRef, useEffect } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  Bell,
  ChevronDown,
  LogOut,
  User as UserIcon,
  PlayCircle,
  History,
  TrendingUp,
  LayoutDashboard,
  CheckCircle2,
} from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const menuRef = useRef(null);
  const notifRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    setMenuOpen(false);
    navigate("/login");
  };

  const navItems = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Practice", path: "/practice" },
    { label: "Interviews", path: "/interviews" },
    { label: "Progress", path: "/progress" },
    { label: "Profile", path: "/profile" },
  ];

  const notifications = user?.has_completed_onboarding
    ? [
        { id: 1, title: "Welcome to InterviewAI", desc: "Start practicing with your target role.", time: "Just now" },
      ]
    : [
        { id: 1, title: "Welcome to InterviewAI", desc: "Select your role and begin your first mock session.", time: "Just now" },
      ];

  return (
    <>
      {/* ── Top Navigation Bar (Desktop 68px) ────────────────────────── */}
      <header className="top-nav">
        <div className="container top-nav__inner">
          {/* Brand Logo */}
          <Link to="/dashboard" className="brand-logo" id="nav-brand-logo">
            <div className="brand-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v3" />
                <path d="M12 19v3" />
                <path d="M2 12h3" />
                <path d="M19 12h3" />
              </svg>
            </div>
            <span className="brand-name">
              Interview<span>AI</span>
            </span>
          </Link>

          {/* Center Navigation Links (Spacing 24-32px) */}
          {user && (
            <nav className="nav-links" id="desktop-nav-links" style={{ gap: "8px" }}>
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          )}

          {/* Right User Controls */}
          <div className="nav-right">
            {user ? (
              <>
                {/* Notification Bell */}
                <div style={{ position: "relative" }} ref={notifRef}>
                  <button
                    className="icon-btn"
                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                    aria-label="Notifications"
                    id="nav-notif-btn"
                  >
                    <Bell size={18} strokeWidth={2} />
                    <span className="icon-btn-badge" />
                  </button>

                  {/* Notification Popover */}
                  {notificationsOpen && (
                    <div
                      style={{
                        position: "absolute",
                        right: 0,
                        top: "calc(100% + 10px)",
                        width: "320px",
                        backgroundColor: "var(--surface)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "var(--r-lg)",
                        boxShadow: "var(--shadow-lg)",
                        padding: "16px",
                        zIndex: 200,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                        <span style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--text-main)" }}>Notifications</span>
                        <span className="badge" style={{ fontSize: "0.7rem" }}>3 New</span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {notifications.map((n) => (
                          <div
                            key={n.id}
                            style={{
                              padding: "10px 12px",
                              borderRadius: "var(--r-sm)",
                              backgroundColor: "var(--surface-muted)",
                              border: "1px solid var(--border-subtle)",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <CheckCircle2 size={13} color="var(--primary)" />
                              <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-main)" }}>{n.title}</div>
                            </div>
                            <div style={{ fontSize: "0.76rem", color: "var(--text-body)", marginTop: "4px" }}>{n.desc}</div>
                            <div style={{ fontSize: "0.7rem", color: "var(--secondary)", marginTop: "4px", fontWeight: 500 }}>{n.time}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Profile Dropdown */}
                <div style={{ position: "relative" }} ref={menuRef}>
                  <div
                    className="user-profile-menu"
                    onClick={() => setMenuOpen(!menuOpen)}
                    id="user-profile-dropdown-trigger"
                  >
                    <div className="avatar-circle">
                      {user.name ? user.name[0].toUpperCase() : "U"}
                    </div>
                    <span className="user-name-text">{user.name || "User"}</span>
                    <ChevronDown size={14} color="var(--primary)" strokeWidth={2.2} />
                  </div>

                  {menuOpen && (
                    <div
                      style={{
                        position: "absolute",
                        right: 0,
                        top: "calc(100% + 8px)",
                        width: "230px",
                        backgroundColor: "var(--surface)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "var(--r-lg)",
                        boxShadow: "var(--shadow-lg)",
                        padding: "8px",
                        zIndex: 200,
                      }}
                    >
                      <div style={{ padding: "8px 12px", borderBottom: "1px solid var(--border-subtle)", marginBottom: "6px" }}>
                        <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-main)" }}>{user.name || "User"}</div>
                        <div style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>{user.email || ""}</div>
                        {user.role && <span className="badge" style={{ marginTop: "6px", fontSize: "0.7rem" }}>{user.role}</span>}
                      </div>
                      <Link
                        to="/profile"
                        onClick={() => setMenuOpen(false)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "8px 12px",
                          borderRadius: "var(--r-sm)",
                          fontSize: "0.86rem",
                          color: "var(--text-main)",
                          fontWeight: 500,
                        }}
                      >
                        <UserIcon size={15} color="var(--primary)" />
                        Profile Settings
                      </Link>
                      <Link
                        to="/empty-demo"
                        onClick={() => setMenuOpen(false)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "8px 12px",
                          borderRadius: "var(--r-sm)",
                          fontSize: "0.86rem",
                          color: "var(--text-main)",
                          fontWeight: 500,
                        }}
                      >
                        <TrendingUp size={15} color="var(--secondary)" />
                        Empty State View
                      </Link>
                      <div style={{ height: "1px", backgroundColor: "var(--border-subtle)", margin: "4px 0" }} />
                      <button
                        onClick={handleLogout}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          padding: "8px 12px",
                          background: "transparent",
                          border: "none",
                          borderRadius: "var(--r-sm)",
                          fontSize: "0.86rem",
                          color: "var(--primary)",
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                        }}
                      >
                        <LogOut size={15} color="var(--primary)" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div style={{ display: "flex", gap: "10px" }}>
                <Link to="/login" className="btn btn-ghost btn-sm">Sign In</Link>
                <Link to="/signup" className="btn btn-primary btn-sm">Get Started</Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Mobile Bottom Navigation Bar (Clean 5 items) ─────────────── */}
      <nav className="bottom-nav" id="mobile-bottom-nav">
        <NavLink to="/dashboard" className={({ isActive }) => `bottom-nav-item ${isActive ? "active" : ""}`}>
          <LayoutDashboard size={20} />
          <span>Home</span>
        </NavLink>

        <NavLink to="/practice" className={({ isActive }) => `bottom-nav-item ${isActive ? "active" : ""}`}>
          <PlayCircle size={20} />
          <span>Practice</span>
        </NavLink>

        <NavLink to="/interviews" className={({ isActive }) => `bottom-nav-item ${isActive ? "active" : ""}`}>
          <History size={20} />
          <span>History</span>
        </NavLink>

        <NavLink to="/progress" className={({ isActive }) => `bottom-nav-item ${isActive ? "active" : ""}`}>
          <TrendingUp size={20} />
          <span>Progress</span>
        </NavLink>

        <NavLink to="/profile" className={({ isActive }) => `bottom-nav-item ${isActive ? "active" : ""}`}>
          <UserIcon size={20} />
          <span>Profile</span>
        </NavLink>
      </nav>
    </>
  );
}
