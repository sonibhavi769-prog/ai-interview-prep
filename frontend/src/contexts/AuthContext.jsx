/**
 * AuthContext — global auth state for InterviewAI.
 * The backend session is the SINGLE SOURCE OF TRUTH.
 * No mock demo users, no fallback identities.
 */
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import api, { setAccessToken, clearAccessToken } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ── Bootstrap: restore session from backend cookie if valid ── */
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const { data } = await api.post("/auth/refresh");
        if (isMounted && data?.access_token && data?.user) {
          setAccessToken(data.access_token);
          setUser(data.user);
        }
      } catch (err) {
        // No active session or token expired — keep user as null
        clearAccessToken();
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  /* ── Actions ─────────────────────────────────────────────────── */
  const signup = useCallback(async (name, email, password) => {
    const { data } = await api.post("/auth/signup", { name, email, password });
    if (data?.access_token && data?.user) {
      setAccessToken(data.access_token);
      setUser(data.user);
      return data.user;
    }
    throw new Error(data?.error || "Registration failed");
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    if (data?.access_token && data?.user) {
      setAccessToken(data.access_token);
      setUser(data.user);
      return data.user;
    }
    throw new Error(data?.error || "Login failed");
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      /* swallow network failure on logout */
    } finally {
      clearAccessToken();
      setUser(null);
    }
  }, []);

  const updateUser = useCallback((updated) => {
    setUser((prev) => (prev ? { ...prev, ...updated } : null));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated: !!user, signup, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
