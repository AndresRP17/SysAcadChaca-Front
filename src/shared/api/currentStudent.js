import { api } from "./api";

// Resuelve el alumno logueado con GET /students/me (el backend lo identifica
// por el token) y lo cachea en memoria para no repetir el pedido en cada
// vista del portal.
let cachedStudent = null;
let cachedForUserId = null;

export function clearCurrentStudentCache() {
  cachedStudent = null;
  cachedForUserId = null;
}

export async function getCurrentStudent(user) {
  if (!user) return null;
  if (cachedStudent && cachedForUserId === user.id) return cachedStudent;

  const { data } = await api.get("/students/me");

  if (!data) {
    throw new Error("No encontramos un legajo de alumno asociado a tu usuario.");
  }

  cachedStudent = data;
  cachedForUserId = user.id;
  return cachedStudent;
}