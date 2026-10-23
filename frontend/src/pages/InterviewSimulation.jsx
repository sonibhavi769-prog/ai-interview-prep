import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { interviewApi } from "../services/interviewApi";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import { Mic, Type, Clock, ArrowRight, SkipForward, LogOut, AlertCircle, RefreshCw } from "lucide-react";

export default function InterviewSimulation() {
  const navigate = useNavigate();
  const { sessionId } = useParams();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [session, setSession] = useState(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0); // Starts at Question 1

  // Voice vs Type Mode
  const [inputMode, setInputMode] = useState("text"); // default to text for immediate accessibility
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [answerText, setAnswerText] = useState(""); // initially empty

  // Timer countdown: 30 minutes default
  const [secondsRemaining, setSecondsRemaining] = useState(1800);
  const recognitionRef = useRef(null);

  // Fetch session details on mount
  const fetchSession = useCallback(async () => {
    if (!sessionId) {
      setError("No session ID specified.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await interviewApi.getById(sessionId);
      if (!data?.session) {
        throw new Error("Interview session not found.");
      }
      setSession(data.session);
      // Resume from answered count if rejoining an in-progress session
      const answeredCount = data.session.responses?.length || 0;
      const totalQ = data.session.questions?.length || 0;
      if (answeredCount > 0 && answeredCount < totalQ) {
        setCurrentQuestionIdx(answeredCount);
      } else {
        setCurrentQuestionIdx(0);
      }
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "Failed to load interview session.");
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Web Speech API initialization for voice mode
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setAnswerText((prev) => (prev ? prev + " " + transcript : transcript));
      };

      recognition.onerror = () => {
        setIsSpeaking(false);
      };

      recognition.onend = () => {
        setIsSpeaking(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          /* ignore */
        }
      }
    };
  }, []);

  const toggleSpeaking = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Please use text mode or Chrome/Edge.");
      return;
    }

    if (isSpeaking) {
      recognitionRef.current.stop();
      setIsSpeaking(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsSpeaking(true);
      } catch {
        setIsSpeaking(false);
      }
    }
  };

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const questionsList = session?.questions || [];
  const totalQuestions = questionsList.length;
  const currentQ = questionsList[currentQuestionIdx] || { text: "Loading question...", type: "conversational" };
  const progressPercent = totalQuestions > 0 ? ((currentQuestionIdx + 1) / totalQuestions) * 100 : 0;

  const handleNext = async () => {
    if (submitting) return;
    setSubmitting(true);

    try {
      // 1. Submit current response if question exists
      if (currentQ?.id) {
        await interviewApi.submitResponse(sessionId, {
          question_id: currentQ.id,
          question_type: currentQ.type || "conversational",
          answer_text: answerText.trim() || "(No verbal or written answer submitted)",
          source: inputMode,
        });
      }

      setAnswerText("");
      if (isSpeaking && recognitionRef.current) {
        recognitionRef.current.stop();
        setIsSpeaking(false);
      }

      // 2. Check if this was the last question
      if (currentQuestionIdx + 1 >= totalQuestions) {
        await interviewApi.complete(sessionId);
        navigate(`/interview/${sessionId}/results`);
      } else {
        setCurrentQuestionIdx((prev) => prev + 1);
      }
    } catch (err) {
      alert(err?.response?.data?.error || err.message || "Failed to submit response.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      if (currentQ?.id) {
        await interviewApi.submitResponse(sessionId, {
          question_id: currentQ.id,
          question_type: currentQ.type || "conversational",
          answer_text: "(Candidate skipped this question)",
          source: "skipped",
        });
      }
      setAnswerText("");
      if (currentQuestionIdx + 1 >= totalQuestions) {
        await interviewApi.complete(sessionId);
        navigate(`/interview/${sessionId}/results`);
      } else {
        setCurrentQuestionIdx((prev) => prev + 1);
      }
    } catch (err) {
      alert(err?.response?.data?.error || "Failed to skip question");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEnd = async () => {
    if (!window.confirm("Are you sure you want to end this interview early? Your answers so far will be evaluated.")) {
      return;
    }
    setSubmitting(true);
    try {
      if (isSpeaking && recognitionRef.current) {
        recognitionRef.current.stop();
      }
      await interviewApi.abandon(sessionId);
      navigate(`/interview/${sessionId}/results`);
    } catch {
      navigate(`/interview/${sessionId}/results`);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-app)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", color: "var(--text-muted)" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              margin: "0 auto 16px",
              borderRadius: "50%",
              border: "3px solid var(--border-subtle)",
              borderTopColor: "var(--primary)",
              animation: "spin 1s linear infinite",
            }}
          />
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          <span>Loading interview environment...</span>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-app)", padding: "48px 24px" }}>
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <Card style={{ padding: "32px", textAlign: "center" }}>
            <AlertCircle size={44} color="var(--primary)" style={{ margin: "0 auto 16px" }} />
            <h2 style={{ fontSize: "1.3rem", color: "var(--text-main)", marginBottom: "8px" }}>
              Unable to Access Interview
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "24px" }}>
              {error || "This interview session does not exist or belongs to another user account."}
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <Button variant="outline" onClick={() => navigate("/dashboard")}>
                Return to Dashboard
              </Button>
              <Button variant="primary" icon={RefreshCw} onClick={fetchSession}>
                Retry
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-app)", display: "flex", flexDirection: "column" }}>
      {/* ── Active Interview Top Bar ───────────────────────────────── */}
      <header
        style={{
          backgroundColor: "var(--surface)",
          borderBottom: "1px solid var(--border-subtle)",
          padding: "16px 32px",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          {/* Left: Brand logo + Interview Title */}
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <Link to="/dashboard" className="brand-logo">
              <div className="brand-icon" style={{ width: "32px", height: "32px" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                  <circle cx="12" cy="12" r="9" />
                  <circle cx="12" cy="12" r="4" />
                </svg>
              </div>
              <span className="brand-name" style={{ fontSize: "1.15rem" }}>
                Interview<span>AI</span>
              </span>
            </Link>

            <div style={{ height: "22px", width: "1px", backgroundColor: "var(--border-subtle)" }} />

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "0.95rem", color: "var(--text-main)" }}>
                {session.role} Interview
              </span>
              <Badge variant="secondary">{session.interview_type} Format</Badge>
            </div>
          </div>

          {/* Right: Question counter + Countdown Timer */}
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-muted)" }}>
              Question <span style={{ color: "var(--primary)", fontWeight: 700 }}>{currentQuestionIdx + 1}</span> of {totalQuestions}
            </div>

            {/* Timer Badge */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 14px",
                borderRadius: "var(--r-pill)",
                backgroundColor: "var(--secondary-subtle)",
                border: "1px solid var(--secondary-border)",
                color: "var(--text-main)",
                fontFamily: "monospace",
                fontWeight: 700,
                fontSize: "0.95rem",
              }}
            >
              <Clock size={15} color="var(--primary)" strokeWidth={2.3} />
              {formatTimer(secondsRemaining)}
            </div>
          </div>
        </div>

        {/* Global Progress Line (#88665D) */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "3px",
            backgroundColor: "var(--secondary-subtle)",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progressPercent}%`,
              backgroundColor: "var(--primary)",
              transition: "width 0.4s ease",
            }}
          />
        </div>
      </header>

      {/* ── Main Interview Body ──────────────────────────────────────── */}
      <main style={{ flex: 1, padding: "48px 24px 64px", maxWidth: "840px", margin: "0 auto", width: "100%" }}>
        {/* Question Panel */}
        <div style={{ marginBottom: "var(--sp-32)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "var(--sp-12)" }}>
            <Badge variant="primary">
              {currentQ.category || currentQ.type || "Interview Question"}
            </Badge>
            {currentQ.difficulty && (
              <Badge variant="secondary">{currentQ.difficulty}</Badge>
            )}
          </div>

          <h2
            style={{
              fontSize: "1.75rem",
              fontWeight: 700,
              lineHeight: 1.35,
              color: "var(--text-main)",
              letterSpacing: "-0.02em",
            }}
          >
            {currentQ.text || currentQ.title}
          </h2>
          {currentQ.problem_statement && (
            <p style={{ marginTop: "12px", color: "var(--text-body)", fontSize: "0.95rem", lineHeight: 1.6 }}>
              {currentQ.problem_statement}
            </p>
          )}
        </div>

        {/* Input Mode Selector (Voice / Type) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "var(--sp-16)",
          }}
        >
          <div style={{ display: "flex", gap: "var(--sp-8)" }}>
            <Button
              variant={inputMode === "text" ? "primary" : "outline"}
              size="sm"
              icon={Type}
              onClick={() => {
                setInputMode("text");
                if (isSpeaking && recognitionRef.current) {
                  recognitionRef.current.stop();
                  setIsSpeaking(false);
                }
              }}
            >
              Type Answer
            </Button>
            <Button
              variant={inputMode === "voice" ? "primary" : "outline"}
              size="sm"
              icon={Mic}
              onClick={() => setInputMode("voice")}
            >
              Voice Input
            </Button>
          </div>

          <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
            {answerText.trim().split(/\s+/).filter(Boolean).length} words
          </span>
        </div>

        {/* Voice Microphone Control Box */}
        {inputMode === "voice" && (
          <Card
            style={{
              padding: "32px",
              textAlign: "center",
              marginBottom: "var(--sp-24)",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--sp-16)" }}>
              {/* Mic Button */}
              <button
                type="button"
                onClick={toggleSpeaking}
                style={{
                  width: "72px",
                  height: "72px",
                  borderRadius: "50%",
                  backgroundColor: isSpeaking ? "var(--primary)" : "var(--surface-muted)",
                  border: isSpeaking ? "4px solid var(--secondary)" : "2px solid var(--border-subtle)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.25s ease",
                  boxShadow: isSpeaking ? "0 0 24px rgba(136, 102, 93, 0.4)" : "var(--shadow-sm)",
                  color: isSpeaking ? "#FFFFFF" : "var(--primary)",
                }}
                id="mic-record-button"
                aria-label={isSpeaking ? "Stop Recording" : "Start Recording"}
              >
                <Mic size={28} strokeWidth={2.3} />
              </button>

              {/* Status and Action Controls */}
              <div>
                <div style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--text-main)", marginBottom: "4px" }}>
                  {isSpeaking ? "Listening to your answer…" : "Ready to record"}
                </div>
                <p style={{ fontSize: "0.86rem", color: "var(--text-muted)", margin: 0 }}>
                  {isSpeaking
                    ? "Speak clearly. Live transcript will populate the response field below."
                    : "Click the microphone to start speaking your answer."}
                </p>
              </div>

              {/* Control Buttons */}
              <div style={{ display: "flex", gap: "var(--sp-12)", marginTop: "var(--sp-8)" }}>
                <Button
                  variant="primary"
                  size="md"
                  onClick={toggleSpeaking}
                  id="primary-speaking-btn"
                >
                  {isSpeaking ? "Stop Speaking" : "Start Speaking"}
                </Button>
              </div>

              {/* Soundwave animation */}
              {isSpeaking && (
                <div style={{ display: "flex", alignItems: "center", gap: "5px", height: "30px", marginTop: "8px" }}>
                  {[18, 32, 14, 28, 40, 22, 35, 16, 26, 12].map((h, i) => (
                    <div
                      key={i}
                      style={{
                        width: "4px",
                        height: `${h}px`,
                        backgroundColor: i % 2 === 0 ? "var(--primary)" : "var(--secondary)",
                        borderRadius: "2px",
                        animation: "waveAnimation 0.8s infinite alternate",
                        animationDelay: `${i * 0.08}s`,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Answer Area Textarea */}
        <Card style={{ padding: "20px 24px", marginBottom: "var(--sp-28)" }}>
          <label className="form-label" style={{ marginBottom: "var(--sp-8)", display: "block" }}>
            {inputMode === "voice" ? "Speech-to-Text Transcript (Editable)" : "Your Answer"}
          </label>
          <textarea
            className="form-textarea"
            rows={7}
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            placeholder="Type or dictate your response. Be specific, articulate your technical approach, trade-offs, and reasoning..."
            style={{ fontSize: "1rem", lineHeight: 1.7 }}
            disabled={submitting}
          />
        </Card>

        {/* Navigation / Action Bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "var(--sp-16)",
          }}
        >
          <div style={{ display: "flex", gap: "var(--sp-12)" }}>
            <Button
              variant="outline"
              size="md"
              icon={SkipForward}
              onClick={handleSkip}
              disabled={submitting}
              id="skip-question-btn"
            >
              Skip
            </Button>
            <Button
              variant="ghost"
              size="md"
              icon={LogOut}
              onClick={handleEnd}
              disabled={submitting}
              id="end-interview-btn"
            >
              End Session
            </Button>
          </div>

          <Button
            variant="primary"
            size="lg"
            iconRight={ArrowRight}
            onClick={handleNext}
            disabled={submitting}
            id="submit-next-question-btn"
          >
            {submitting
              ? "Submitting..."
              : currentQuestionIdx + 1 === totalQuestions
              ? "Complete & Evaluate"
              : "Next Question"}
          </Button>
        </div>
      </main>
    </div>
  );
}
