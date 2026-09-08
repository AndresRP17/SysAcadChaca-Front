<<<<<<< HEAD
import { api } from "../../../../shared/api/api";

export const loginService = {
  login: async (email, password) => {
    const { data } = await api.post("/login", { email, password });

    if (data.token) {
      localStorage.setItem("token", data.token);
    }
    if (data.user) {
      localStorage.setItem("user", JSON.stringify(data.user));
=======
import { api } from '../../../../shared/api/Api';

export const loginService = {
  login: async (email, password) => {
    const response = await api.post('/login', { email, password });
    const data = response.data;
    if (data.token) {
      localStorage.setItem('authToken', data.token);
    }
    
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
>>>>>>> origin/develop
    }

    return data;
  },

  logout: () => {
<<<<<<< HEAD
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },

  getToken: () => localStorage.getItem("token"),

  getCurrentUser: () => {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated: () => !!localStorage.getItem("token"),
};
=======
    localStorage.removeItem('authToken');
    localStorage.removeItem('user'); // Limpiamos también el usuario
  },

  getToken: () => localStorage.getItem('authToken'),

  // esto para recuperar el usuario persistido
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated: () => !!localStorage.getItem('authToken'),
};
>>>>>>> origin/develop
