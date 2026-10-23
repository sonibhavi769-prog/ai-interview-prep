/**
 * InterviewAI — App Shell with Protected Routing and Real Backend Integration.
 */
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";

import Dashboard from "./pages/Dashboard";
import InterviewSetup from "./pages/InterviewSetup";
import InterviewSimulation from "./pages/InterviewSimulation";
import SessionResults from "./pages/SessionResults";
import Progress from "./pages/Progress";
import Profile from "./pages/Profile";
import InterviewHistory from "./pages/InterviewHistory";
import Login from "./pages/Login";
import EmptyStatesDemo from "./pages/EmptyStatesDemo";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
        <Routes>
          {/* Default redirect to Dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Login />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/practice"
            element={
              <ProtectedRoute>
                <InterviewSetup />
              </ProtectedRoute>
            }
          />
          <Route
            path="/interview/new"
            element={
              <ProtectedRoute>
                <InterviewSetup />
              </ProtectedRoute>
            }
          />

          <Route
            path="/interview/:sessionId"
            element={
              <ProtectedRoute>
                <InterviewSimulation />
              </ProtectedRoute>
            }
          />

          <Route
            path="/interview/:sessionId/results"
            element={
              <ProtectedRoute>
                <SessionResults />
              </ProtectedRoute>
            }
          />

          <Route
            path="/progress"
            element={
              <ProtectedRoute>
                <Progress />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/interviews"
            element={
              <ProtectedRoute>
                <InterviewHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <InterviewHistory />
              </ProtectedRoute>
            }
          />

          {/* Legacy redirects */}
          <Route path="/interview/active" element={<Navigate to="/practice" replace />} />
          <Route path="/results/demo" element={<Navigate to="/dashboard" replace />} />

          {/* Empty States Design Reference */}
          <Route path="/empty-demo" element={<EmptyStatesDemo />} />

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
