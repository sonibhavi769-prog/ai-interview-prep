import api from "./api";

export const progressApi = {
  getHistory: async () => {
    const res = await api.get("/progress/history");
    return res.data; // { history: [...] }
  },

  getTrends: async () => {
    const res = await api.get("/progress/trends");
    return res.data; // { trends: [...] }
  },

  getStats: async () => {
    const res = await api.get("/progress/stats");
    return res.data; // { stats: {...} }
  },
};

export default progressApi;
