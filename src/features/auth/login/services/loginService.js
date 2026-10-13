import { api } from "../../../../shared/api/api";
import { authStorage } from "../../../../shared/utils/authStorage";

export const loginService = {
  login: async (email, password, remember) => {
    const { data } = await api.post("/login", { email, password });

    authStorage.save(data.token, data.user, remember);

    return data;
  },

  logout: () => {
    const token = authStorage.getToken();
    authStorage.clear();

    // El servidor invalida el token (POST /logout). La salida local no espera ni depende de eso.
    if (token) {
      api.post("/logout", null, { headers: { Authorization: token } }).catch(() => {});
    }
  },

  getToken: () => authStorage.getToken(),

  getCurrentUser: () => authStorage.getUser(),

  isAuthenticated: () => !!authStorage.getToken(),
};
