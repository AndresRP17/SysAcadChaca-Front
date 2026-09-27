import axios from "axios";
import { authStorage } from "../utils/authStorage";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8087";

export const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = authStorage.getToken();
  if (token) {
    config.headers.Authorization = token;
  }
  return config;
});

// Rutas públicas: un 401 acá es "credenciales inválidas", no una sesión vencida,
// así que no corresponde cerrar sesión ni recargar (se perdería el mensaje).
const PUBLIC_PATHS = ["/login", "/forgot-password", "/reset-password", "/resend-verify-email"];

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isPublicRequest = PUBLIC_PATHS.some((path) => error.config?.url?.startsWith(path));

    if (error.response?.status === 401 && !isPublicRequest) {
      authStorage.clear();
      window.location.href = "/";
    }

    // Se rechaza el error de axios original (conserva error.response), pero con
    // el mensaje de la API, para que `err.message` muestre algo útil en todos
    // los formularios en vez de "Request failed with status code 409".
    const apiMessage = error.response?.data?.error;
    if (apiMessage) error.message = apiMessage;

    return Promise.reject(error);
  },
);

// El interceptor de arriba propaga el error de axios tal cual (no el mensaje de
// la API), asi que los componentes que quieran mostrarlo en un formulario deben
// usar esto en vez de err.message.
export function getErrorMessage(err, fallback = "Ocurrió un error") {
  return err?.response?.data?.error || err?.message || fallback;
}
