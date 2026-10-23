# Response Contract — Interview Session Handoff

> **Purpose:** Defines the response payload per question type and the session-completion event shape.
> This contract is the boundary between the *Interview Experience* workstream (which writes responses)
> and the *Evaluation / Feedback* workstream (which reads them to produce scores and reports).

---

## 1. Per-Question Response Payload

Every response stored in `interview_sessions.responses[]` follows one of the two schemas below.

### Common fields (all question types)

| Field | Type | Description |
|-------|------|-------------|
| `question_id` | `string (UUID)` | References `questions[].id` in the same session. |
| `question_type` | `"conversational" \| "coding_task"` | Determines which type-specific fields are present. |
| `submitted_at` | `datetime (ISO 8601)` | Server-set timestamp of when the response was recorded. |

### Type: `conversational`

| Field | Type | Description |
|-------|------|-------------|
| `answer_text` | `string` | The candidate's free-text answer. |
| `source` | `"text" \| "voice"` | Input method. `"voice"` will be used once STT is implemented; currently always `"text"`. |

**Question metadata available on the session:**

| Field | Type |
|-------|------|
| `text` | `string` — the interview question |
| `category` | `"Technical" \| "HR"` |
| `difficulty` | `"easy" \| "medium" \| "hard"` |

### Type: `coding_task`

| Field | Type | Description |
|-------|------|-------------|
| `submitted_code` | `string` | The candidate's code submission. |
| `language` | `string` | Programming language selected (e.g. `"python"`, `"javascript"`, `"java"`, `"cpp"`). |
| `approach_explanation` | `string` | Free-text field where the candidate explains their thought process. |

**Question metadata available on the session:**

| Field | Type |
|-------|------|
| `title` | `string` — short problem title |
| `problem_statement` | `string` — detailed description |
| `constraints` | `string` — input/output constraints |
| `starter_code` | `string \| ""` — optional template |
| `allowed_languages` | `string[]` |
| `difficulty` | `"easy" \| "medium" \| "hard"` |

---

## 2. Full Response Object Example

```json
{
  "question_id": "a1b2c3d4-...",
  "question_type": "conversational",
  "answer_text": "React uses a virtual DOM to minimise direct DOM manipulation…",
  "source": "text",
  "submitted_at": "2026-09-25T12:34:56Z"
}
```

```json
{
  "question_id": "e5f6g7h8-...",
  "question_type": "coding_task",
  "submitted_code": "def two_sum(nums, target):\n    seen = {}\n    for i, n in enumerate(nums):\n        if target - n in seen:\n            return [seen[target - n], i]\n        seen[n] = i",
  "language": "python",
  "approach_explanation": "Hash map approach — O(n) time, O(n) space. Single pass.",
  "submitted_at": "2026-09-25T12:36:12Z"
}
```

---

## 3. Session-Completion Event

Emitted when a session ends (either completed or abandoned). Stored on the session document itself.

| Field | Type | Description |
|-------|------|-------------|
| `session_id` | `string (UUID)` | Unique session identifier. |
| `user_id` | `string (ObjectId)` | The authenticated user who took the interview. |
| `status` | `"completed" \| "abandoned"` | Whether all questions were answered. |
| `ended_at` | `datetime (ISO 8601)` | Server-set timestamp of session end. |

**Additional context on the session document:**

| Field | Type |
|-------|------|
| `role` | `string` — target job role |
| `domain` | `string` — technical domain |
| `interview_type` | `"Technical" \| "HR" \| "Mixed"` |
| `questions` | `array` — full question set |
| `responses` | `array` — all submitted responses |
| `created_at` | `datetime` — session start |

---

## 4. Notes for the Evaluation Workstream

- **Do not assume all questions have responses.** Abandoned sessions will have `responses.length < questions.length`.
- **Match responses to questions via `question_id`.** Don't rely on array index ordering.
- **`coding_task` responses have no execution results.** Code execution is deferred (see open questions in the implementation plan). Evaluate based on code quality, correctness heuristics, and the approach explanation.
- **`source: "voice"` responses may appear once STT is implemented.** The evaluation pipeline should handle both text and voice-sourced answers identically for now.
