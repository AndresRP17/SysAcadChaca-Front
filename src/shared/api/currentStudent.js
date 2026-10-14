import { api } from "./api";

// Resuelve el alumno logueado con GET /students/me (el backend lo identifica
// por el token) y lo cachea en memoria para no repetir el pedido en cada
// vista del portal. También se guarda en sessionStorage: al recargar la página
// no hay que esperar ese pedido antes de pedir todo lo demás (depende de su id
// y su plan, que casi nunca cambian).
const STORAGE_KEY = "sga_current_student";

let cachedStudent = null;
let cachedForUserId = null;

function readStored(userId) {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const { userId: storedUserId, student } = JSON.parse(raw);
    return storedUserId === userId ? student : null;
  } catch {
    return null;
  }
}

function writeStored(userId, student) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ userId, student }));
  } catch {
    // sin sessionStorage solo se pierde el ahorro
  }
}

export function clearCurrentStudentCache() {
  cachedStudent = null;
  cachedForUserId = null;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // nada que limpiar
  }
}

export async function getCurrentStudent(user) {
  if (!user) return null;
  if (cachedStudent && cachedForUserId === user.id) return cachedStudent;

  const stored = readStored(user.id);
  if (stored) {
    cachedStudent = stored;
    cachedForUserId = user.id;
    return cachedStudent;
  }

  const { data } = await api.get("/students/me");

  if (!data) {
    throw new Error("No encontramos un legajo de alumno asociado a tu usuario.");
  }

  cachedStudent = data;
  cachedForUserId = user.id;
  writeStored(user.id, data);
  return cachedStudent;
}
