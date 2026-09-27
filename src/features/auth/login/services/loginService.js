import { api } from "../../../../shared/api/api";
import { authStorage } from "../../../../shared/utils/authStorage";

export const loginService = {
  login: async (email, password, remember) => {
    const { data } = await api.post("/login", { email, password });

    authStorage.save(data.token, data.user, remember);

    return data;
  },

  logout: () => {
    authStorage.clear();
  },

  getToken: () => authStorage.getToken(),

  getCurrentUser: () => authStorage.getUser(),

  isAuthenticated: () => !!authStorage.getToken(),
};
