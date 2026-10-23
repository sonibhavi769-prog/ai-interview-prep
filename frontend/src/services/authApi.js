import api from "./api";

export const authApi = {
  login: async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    return res.data;
  },
  signup: async (name, email, password) => {
    const res = await api.post("/auth/signup", { name, email, password });
    return res.data;
  },
  logout: async () => {
    const res = await api.post("/auth/logout");
    return res.data;
  },
  refresh: async () => {
    const res = await api.post("/auth/refresh");
    return res.data;
  },
  getMe: async () => {
    const res = await api.get("/auth/me");
    return res.data;
  },
};

export default authApi;
