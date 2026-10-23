import api from "./api";

export const userApi = {
  updateProfile: async (data) => {
    const res = await api.put("/users/me/profile", data);
    return res.data; // { user: {...} }
  },

  getOptions: async () => {
    const res = await api.get("/users/me/options");
    return res.data; // { roles: [...], domains: [...], coding_domains: [...] }
  },
};

export default userApi;
