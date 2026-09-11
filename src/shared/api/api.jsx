import axios from "axios";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8087";

export const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = token;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/";
    }

    return Promise.reject(error);
    //se perdia el error, de esta forma queda disponible a toda la app
    // const message = error.response?.data?.error || error.message || "Ocurrió un error";
    // return Promise.reject(new Error(message));
  },
);

// El interceptor de arriba propaga el error de axios tal cual (no el mensaje de
// la API), asi que los componentes que quieran mostrarlo en un formulario deben
// usar esto en vez de err.message.
export function getErrorMessage(err, fallback = "Ocurrió un error") {
  return err?.response?.data?.error || err?.message || fallback;
}
