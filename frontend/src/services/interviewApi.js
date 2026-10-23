import api from "./api";

export const interviewApi = {
  create: async ({ role, domain, interview_type = "Mixed", total_questions = 10, coding_ratio = null }) => {
    const payload = { role, domain, interview_type, total_questions };
    if (coding_ratio !== null) payload.coding_ratio = coding_ratio;
    const res = await api.post("/interviews", payload);
    return res.data;
  },

  getById: async (sessionId) => {
    const res = await api.get(`/interviews/${sessionId}`);
    return res.data; // { session: {...} }
  },

  submitResponse: async (sessionId, responseData) => {
    const res = await api.post(`/interviews/${sessionId}/responses`, responseData);
    return res.data;
  },

  complete: async (sessionId) => {
    const res = await api.patch(`/interviews/${sessionId}/complete`);
    return res.data;
  },

  abandon: async (sessionId) => {
    const res = await api.patch(`/interviews/${sessionId}/abandon`);
    return res.data;
  },

  getResults: async (sessionId) => {
    const res = await api.get(`/interviews/${sessionId}/results`);
    return res.data; // { session: {...}, evaluation: {...} }
  },

  retryEvaluation: async (sessionId) => {
    const res = await api.post(`/interviews/${sessionId}/retry-eval`);
    return res.data;
  },
};

export default interviewApi;
