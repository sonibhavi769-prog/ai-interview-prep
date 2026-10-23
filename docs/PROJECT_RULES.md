# Project Rules — AI Interview Preparation System

Read alongside `docs/PRD.md`. These are the standing conventions every agent
session in this repo should follow, so they don't need to be repeated in
every prompt.

## Tech stack (do not deviate without asking)

- **Frontend:** React.js (HTML/CSS/JS)
- **Backend:** Python — Flask or Django (Node.js is an acceptable fallback
  only if a task specifically calls for it)
- **AI / NLP:** NLTK, spaCy, plus an LLM API for question generation and
  answer evaluation
- **Database:** MongoDB
- **Speech:** a Speech-to-Text API for voice-based responses
- **Version control:** Git / GitHub

## Conventions

- Keep frontend and backend in separate top-level directories (`/frontend`,
  `/backend`) with clear API boundaries between them.
- All NLP/LLM evaluation logic lives behind a single service layer
  (e.g. `backend/services/evaluation/`) so the scoring provider can be
  swapped without touching the rest of the app (see open question on LLM/STT
  vendor choice in the PRD, section 11).
- User-facing responses (feedback, questions) go through this service layer
  too — no direct LLM calls from route handlers.
- Every response-evaluation feature must produce three scores: communication,
  confidence, technical accuracy — plus a free-text feedback string. Keep
  this shape consistent across question types (Technical vs HR).
- Treat interview recordings/transcripts and performance history as
  sensitive user data: never log full transcripts, encrypt at rest, and
  scope all reads to the authenticated user (see PRD section 9, Data
  privacy).
- Favor incremental, testable slices: question generation, mock-interview
  simulation, evaluation, feedback, and progress tracking (PRD section 6)
  are five separable features — build and review one at a time rather than
  end-to-end in a single pass.
- Non-goals for this release: no live human interviewer/video, no
  multi-language support, no ATS integration, no native mobile apps (PRD
  section 5). Don't scaffold for these unless explicitly asked.

## Working style for agents

- For any new feature, produce an implementation plan Artifact first
  (Planning mode) before writing code — reference the relevant PRD section
  by number.
- Keep each agent session scoped to one feature from the table in PRD
  section 6. Don't let one session sprawl across multiple features.
- Flag, rather than silently resolve, anything touching the open questions
  in PRD section 11 (LLM/STT provider choice, accent handling, data
  retention policy) — these need a human decision.
