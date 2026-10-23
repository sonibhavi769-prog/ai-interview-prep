import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { userApi } from "../services/userApi";
import PageContainer, { PageHeader } from "../components/ui/PageContainer";
import Card, { CardHeader } from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import Toast from "../components/ui/Toast";
import { Edit3, Check, X, Plus } from "lucide-react";

export default function Profile() {
  const { user, updateUser } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [options, setOptions] = useState({ roles: [], domains: [] });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
    domain: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        role: user.role || "",
        domain: user.domain || "",
      });
    }
  }, [user]);

  useEffect(() => {
    (async () => {
      try {
        const data = await userApi.getOptions();
        setOptions({
          roles: data.roles || [],
          domains: data.domains || [],
        });
      } catch {
        /* fallback options */
      }
    })();
  }, []);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {};
      if (formData.role) payload.role = formData.role;
      if (formData.domain) payload.domain = formData.domain;

      const res = await userApi.updateProfile(payload);
      if (res.user) {
        updateUser(res.user);
      }
      setIsEditing(false);
      setToastMessage("Profile updated successfully!");
    } catch (err) {
      setToastMessage(err?.response?.data?.error || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageContainer maxWidth={860}>
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <PageHeader
        title="Profile Settings"
        subtitle="Manage your personal information and target career orientation for AI mock interviews."
        action={
          isEditing ? (
            <div style={{ display: "flex", gap: "var(--sp-8)" }}>
              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  setFormData({
                    name: user?.name || "",
                    email: user?.email || "",
                    role: user?.role || "",
                    domain: user?.domain || "",
                  });
                  setIsEditing(false);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                icon={Check}
                onClick={handleSave}
                disabled={saving}
                id="save-profile-btn"
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          ) : (
            <Button
              variant="primary"
              size="md"
              icon={Edit3}
              onClick={() => setIsEditing(true)}
              id="edit-profile-btn-main"
            >
              Edit Profile
            </Button>
          )
        }
      />

      {/* ── Top Profile Overview Banner Card ─────────────────────────── */}
      <Card
        size="lg"
        style={{
          marginBottom: "var(--sp-24)",
          display: "flex",
          alignItems: "center",
          gap: "var(--sp-24)",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            width: "72px",
            height: "72px",
            borderRadius: "50%",
            backgroundColor: "var(--primary)",
            color: "#FFFFFF",
            fontSize: "1.875rem",
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-heading)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          {formData.name ? formData.name[0].toUpperCase() : "U"}
        </div>

        <div style={{ flex: 1, minWidth: "220px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "4px" }}>
            <h2 style={{ fontSize: "1.45rem", color: "var(--text-main)" }}>
              {formData.name || "User Profile"}
            </h2>
            <Badge variant="completed">Active Candidate</Badge>
          </div>
          <p style={{ fontSize: "0.9rem", color: "var(--text-body)" }}>
            {formData.role || "Target role not set"} • {formData.domain || "Domain not set"}
          </p>
          <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "4px" }}>
            {formData.email}
          </div>
        </div>
      </Card>

      {/* ── Form Sections ────────────────────────────────────────────── */}
      <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "var(--sp-24)" }}>
        {/* Section 1: Account Information */}
        <Card>
          <CardHeader
            title="Account Information"
            subtitle="Your verified account credentials."
          />
          <div className="grid-12">
            <div className="col-6">
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" htmlFor="profile-name">Candidate Name</label>
                <input
                  id="profile-name"
                  type="text"
                  className="form-input"
                  value={formData.name}
                  disabled
                />
              </div>
            </div>

            <div className="col-6">
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" htmlFor="profile-email">Email Address</label>
                <input
                  id="profile-email"
                  type="email"
                  className="form-input"
                  value={formData.email}
                  disabled
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Section 2: Professional Orientation */}
        <Card>
          <CardHeader
            title="Professional Orientation"
            subtitle="Target career orientation used by AI to generate customized mock questions."
          />
          <div className="grid-12">
            <div className="col-6">
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" htmlFor="profile-role">Target Role</label>
                {isEditing && options.roles.length > 0 ? (
                  <select
                    id="profile-role"
                    className="form-select"
                    value={formData.role}
                    onChange={(e) => handleChange("role", e.target.value)}
                  >
                    <option value="">Select Target Role</option>
                    {options.roles.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    id="profile-role"
                    type="text"
                    className="form-input"
                    value={formData.role || "Not specified"}
                    disabled
                  />
                )}
              </div>
            </div>

            <div className="col-6">
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" htmlFor="profile-domain">Technical Domain</label>
                {isEditing && options.domains.length > 0 ? (
                  <select
                    id="profile-domain"
                    className="form-select"
                    value={formData.domain}
                    onChange={(e) => handleChange("domain", e.target.value)}
                  >
                    <option value="">Select Domain</option>
                    {options.domains.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    id="profile-domain"
                    type="text"
                    className="form-input"
                    value={formData.domain || "Not specified"}
                    disabled
                  />
                )}
              </div>
            </div>
          </div>
        </Card>
      </form>

      {/* ── Toast Notification ───────────────────────────────────────── */}
      <Toast message={toastMessage} onClose={() => setToastMessage("")} />
    </PageContainer>
  );
}
