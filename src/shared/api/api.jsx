import axios from "axios";
import { authStorage } from "../utils/authStorage";
import { installRequestCache } from "./requestCache";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8087";

// Si el servidor no responde en este tiempo se corta el pedido, para que las pantallas
// no queden en "Cargando..." para siempre.
export const REQUEST_TIMEOUT_MS = 20000;

export const api = axios.create({
  baseURL: API_URL,
  timeout: REQUEST_TIMEOUT_MS,
});

// Los GET se cachean un momento y las escrituras vacían el cache (ver requestCache.js).
export const { clear: clearApiCache } = installRequestCache(api, { getToken: () => authStorage.getToken() });

// Clave de sessionStorage con la que el interceptor avisa al login que la sesión venció.
export const SESSION_EXPIRED_KEY = "sga_session_expired";

api.interceptors.request.use((config) => {
  const token = authStorage.getToken();
  if (token) {
    config.headers.Authorization = token;
  }
  return config;
});

// Rutas públicas: un 401 acá es "credenciales inválidas", no una sesión vencida,
// así que no corresponde cerrar sesión ni recargar (se perdería el mensaje).
const PUBLIC_PATHS = ["/login", "/logout", "/forgot-password", "/reset-password", "/resend-verify-email"];

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isPublicRequest = PUBLIC_PATHS.some((path) => error.config?.url?.startsWith(path));

    if (error.response?.status === 401 && !isPublicRequest) {
      authStorage.clear();
      try {
        sessionStorage.setItem(SESSION_EXPIRED_KEY, "1");
      } catch {
        // sin sessionStorage solo se pierde el aviso
      }
      window.location.href = "/";
    }

    // Se rechaza el error de axios original (conserva error.response), pero con
    // un mensaje legible en español, para que `err.message` muestre algo útil en
    // todos los formularios en vez de "Request failed with status code 409".
    error.message = describeError(error);

    return Promise.reject(error);
  },
);

const ENUM_LABELS = {
  ALUMNO_REGULAR: "alumno regular",
  ANALITICO: "analítico",
  MATERIAS_APROBADAS: "materias aprobadas",
  SCHEDULED: "programada",
  CANCELLED: "cancelada",
  HOLIDAY: "feriado",
  PENDING: "pendiente",
  ISSUED: "emitido",
  REJECTED: "rechazado",
  APPROVED: "aprobado",
};

// Los mensajes del servidor a veces traen fechas ISO (2026-11-23) o valores de enum
// (ALUMNO_REGULAR): se pasan a como se lee en pantalla.
export function humanizeServerMessage(message) {
  return String(message)
    .replace(/\b(\d{4})-(\d{2})-(\d{2})\b/g, "$3/$2/$1")
    .replace(/\b[A-Z]{3,}(?:_[A-Z]+)*\b/g, (word) => ENUM_LABELS[word] ?? word);
}

// Clasifica un error de axios: "network" (sin conexión), "timeout", "server" (5xx),
// "forbidden", "notFound", "unauthorized", "conflict" (409/422/otros 4xx con mensaje).
export function getErrorKind(err) {
  if (err?.code === "ECONNABORTED" || err?.code === "ETIMEDOUT") return "timeout";
  const status = err?.response?.status;
  if (!status) return err?.request || err?.code === "ERR_NETWORK" ? "network" : "unknown";
  if (status >= 500) return "server";
  if (status === 401) return "unauthorized";
  if (status === 403) return "forbidden";
  if (status === 404) return "notFound";
  return "conflict";
}

const KIND_MESSAGES = {
  network: "No hay conexión con el servidor. Revisá tu internet e intentá de nuevo.",
  timeout: "El servidor tardó demasiado en responder. Intentá de nuevo en unos instantes.",
  server: "Tuvimos un problema en el servidor. Intentá de nuevo en unos minutos.",
  forbidden: "No tenés permiso para hacer esto.",
  notFound: "No encontramos lo que buscabas. Puede que ya no exista.",
  unauthorized: "Tu sesión expiró, ingresá de nuevo.",
};

function describeError(err) {
  const kind = getErrorKind(err);
  const serverMessage = err?.response?.data?.error;

  // 409/422 y demás 4xx: el servidor explica qué pasó, y se muestra tal cual (legible).
  if (kind === "conflict") {
    return serverMessage ? humanizeServerMessage(serverMessage) : "No se pudo completar la operación. Revisá los datos.";
  }
  // Un 403/404 con mensaje propio del servidor suele ser más específico que el genérico.
  if ((kind === "forbidden" || kind === "notFound" || kind === "unauthorized") && serverMessage) return humanizeServerMessage(serverMessage);
  return KIND_MESSAGES[kind] ?? err?.message ?? "Ocurrió un error";
}

// Los componentes que quieran mostrar el error en pantalla deben usar esto en vez
// de err.message. El segundo parámetro es solo el texto de respaldo.
export function getErrorMessage(err, fallback = "Ocurrió un error") {
  if (err?.response || err?.request || err?.code) return describeError(err);
  return err?.message || fallback;
}

// Codigo estable que el backend agrega a ciertos errores de dominio (campo "code"), para no
// depender del texto del mensaje. Ej.: ENROLLMENT_PERIOD_CLOSED.
export function getErrorCode(err) {
  return err?.response?.data?.code ?? null;
}

export const ENROLLMENT_PERIOD_CLOSED = "ENROLLMENT_PERIOD_CLOSED";

// El backend manda, en un 422, un mapa {campo: mensaje} además del mensaje
// general (RequestValidator). Los formularios lo usan para marcar el campo
// puntual en vez de mostrar solo "Datos invalidos".
export function getFieldErrors(err) {
  return err?.response?.data?.errors ?? {};
}
