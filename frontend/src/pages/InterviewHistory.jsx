import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { progressApi } from "../services/progressApi";
import PageContainer, { PageHeader } from "../components/ui/PageContainer";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import { Search, Play, ArrowRight, RefreshCw, AlertCircle, Calendar, CheckCircle } from "lucide-react";

export default function InterviewHistory() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessions, setSessions] = useState([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [domainFilter, setDomainFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [scoreFilter, setScoreFilter] = useState("all");
  const [viewMode, setViewMode] = useState("table"); // 'table' | 'cards'

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await progressApi.getHistory();
      setSessions(data.history || []);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "Failed to load interview history");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Unique roles and domains for dynamic filters
  const uniqueRoles = useMemo(() => {
    return Array.from(new Set(sessions.map((s) => s.role).filter(Boolean)));
  }, [sessions]);

  const uniqueDomains = useMemo(() => {
    return Array.from(new Set(sessions.map((s) => s.domain).filter(Boolean)));
  }, [sessions]);

  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      // Search text
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          (s.role || "").toLowerCase().includes(q) ||
          (s.domain || "").toLowerCase().includes(q) ||
          (s.interview_type || "").toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Role filter
      if (roleFilter !== "all" && s.role !== roleFilter) return false;

      // Domain filter
      if (domainFilter !== "all" && s.domain !== domainFilter) return false;

      // Type filter
      if (typeFilter !== "all" && !(s.interview_type || "").toLowerCase().includes(typeFilter.toLowerCase())) return false;

      // Score filter
      if (scoreFilter !== "all") {
        if (s.overall_score == null) return false;
        if (scoreFilter === "85+" && s.overall_score < 85) return false;
        if (scoreFilter === "75-84" && (s.overall_score < 75 || s.overall_score > 84)) return false;
        if (scoreFilter === "<75" && s.overall_score >= 75) return false;
      }

      return true;
    });
  }, [sessions, searchQuery, roleFilter, domainFilter, typeFilter, scoreFilter]);

  return (
    <PageContainer>
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <PageHeader
        title="Interview History"
        subtitle="Search and review your past mock interview sessions, diagnostics, and AI evaluations."
        action={
          <Button
            variant="primary"
            size="md"
            icon={Play}
            onClick={() => navigate("/practice")}
            id="history-new-interview-btn"
          >
            Start Mock Interview
          </Button>
        }
      />

      {loading ? (
        <Card style={{ padding: "32px", textAlign: "center" }}>
          <div style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>Loading your interview records...</div>
        </Card>
      ) : error ? (
        <Card style={{ padding: "32px", textAlign: "center" }}>
          <AlertCircle size={36} color="var(--primary)" style={{ margin: "0 auto 12px" }} />
          <h3 style={{ color: "var(--text-main)", marginBottom: "8px" }}>Could not load history</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginBottom: "16px" }}>{error}</p>
          <Button variant="primary" icon={RefreshCw} onClick={fetchHistory}>
            Retry
          </Button>
        </Card>
      ) : sessions.length === 0 ? (
        <EmptyState
          title="No Interviews Yet"
          description="You haven't completed any mock interviews yet. Start your first session to build your interview track record."
          actionLabel="Start Mock Interview"
          onAction={() => navigate("/practice")}
        />
      ) : (
        <>
          {/* ── Search Bar & Filter Controls ─────────────────────────────── */}
          <Card style={{ padding: "20px 24px", marginBottom: "var(--sp-24)" }}>
            <div style={{ position: "relative", marginBottom: "var(--sp-16)" }}>
              <Search
                size={18}
                color="var(--primary)"
                strokeWidth={2}
                style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }}
              />
              <input
                type="text"
                className="form-input"
                placeholder="Search by role, domain, or interview type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: "42px" }}
              />
            </div>

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {uniqueRoles.length > 0 && (
                  <select
                    className="form-select"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    style={{ fontSize: "0.85rem", padding: "6px 12px" }}
                  >
                    <option value="all">All Roles</option>
                    {uniqueRoles.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                )}

                {uniqueDomains.length > 0 && (
                  <select
                    className="form-select"
                    value={domainFilter}
                    onChange={(e) => setDomainFilter(e.target.value)}
                    style={{ fontSize: "0.85rem", padding: "6px 12px" }}
                  >
                    <option value="all">All Domains</option>
                    {uniqueDomains.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                )}

                <select
                  className="form-select"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  style={{ fontSize: "0.85rem", padding: "6px 12px" }}
                >
                  <option value="all">All Types</option>
                  <option value="technical">Technical</option>
                  <option value="hr">HR</option>
                  <option value="mixed">Mixed</option>
                </select>

                <select
                  className="form-select"
                  value={scoreFilter}
                  onChange={(e) => setScoreFilter(e.target.value)}
                  style={{ fontSize: "0.85rem", padding: "6px 12px" }}
                >
                  <option value="all">All Scores</option>
                  <option value="85+">85% and above</option>
                  <option value="75-84">75% - 84%</option>
                  <option value="<75">Below 75%</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: "6px" }}>
                <Button
                  variant={viewMode === "table" ? "primary" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("table")}
                >
                  Table
                </Button>
                <Button
                  variant={viewMode === "cards" ? "primary" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("cards")}
                >
                  Cards
                </Button>
              </div>
            </div>
          </Card>

          {/* ── Sessions List / Table ────────────────────────────────────── */}
          {filteredSessions.length === 0 ? (
            <EmptyState
              title="No Matching Sessions"
              description="We couldn't find any mock interview sessions matching your query. Try adjusting your search or filters."
            />
          ) : viewMode === "table" ? (
            <Card style={{ overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.88rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border-subtle)", backgroundColor: "var(--surface-muted)", color: "var(--text-muted)" }}>
                      <th style={{ padding: "12px 18px", fontWeight: 600 }}>Role & Domain</th>
                      <th style={{ padding: "12px 18px", fontWeight: 600 }}>Type</th>
                      <th style={{ padding: "12px 18px", fontWeight: 600 }}>Date</th>
                      <th style={{ padding: "12px 18px", fontWeight: 600 }}>Status</th>
                      <th style={{ padding: "12px 18px", fontWeight: 600 }}>Overall Score</th>
                      <th style={{ padding: "12px 18px", fontWeight: 600 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSessions.map((session) => (
                      <tr key={session.session_id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                        <td style={{ padding: "14px 18px" }}>
                          <div style={{ fontWeight: 600, color: "var(--text-main)" }}>{session.role}</div>
                          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{session.domain}</div>
                        </td>
                        <td style={{ padding: "14px 18px", color: "var(--text-body)" }}>{session.interview_type}</td>
                        <td style={{ padding: "14px 18px", color: "var(--text-muted)", fontSize: "0.82rem" }}>
                          {session.created_at ? new Date(session.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—"}
                        </td>
                        <td style={{ padding: "14px 18px" }}>
                          <Badge variant={session.status === "completed" ? "completed" : "pending"}>
                            {session.status}
                          </Badge>
                        </td>
                        <td style={{ padding: "14px 18px" }}>
                          <span style={{ fontWeight: 700, color: "var(--primary)", fontSize: "1rem" }}>
                            {session.overall_score != null ? `${session.overall_score}%` : "—"}
                          </span>
                        </td>
                        <td style={{ padding: "14px 18px" }}>
                          <Button
                            variant="outline"
                            size="sm"
                            iconRight={ArrowRight}
                            onClick={() => navigate(`/interview/${session.session_id}/results`)}
                          >
                            Results
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
              {filteredSessions.map((session) => (
                <Card key={session.session_id} style={{ padding: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                    <div>
                      <h4 style={{ fontSize: "1rem", color: "var(--text-main)", marginBottom: "4px" }}>{session.role}</h4>
                      <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>{session.domain}</p>
                    </div>
                    <Badge variant={session.status === "completed" ? "completed" : "pending"}>
                      {session.status}
                    </Badge>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "12px", borderTop: "1px solid var(--border-subtle)" }}>
                    <div>
                      <span style={{ fontSize: "0.76rem", color: "var(--text-muted)", display: "block" }}>Overall Score</span>
                      <span style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--primary)" }}>
                        {session.overall_score != null ? `${session.overall_score}%` : "—"}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      iconRight={ArrowRight}
                      onClick={() => navigate(`/interview/${session.session_id}/results`)}
                    >
                      View Results
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </PageContainer>
  );
}
