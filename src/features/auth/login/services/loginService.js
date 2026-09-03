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
    }

    return data;
  },

  logout: () => {
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