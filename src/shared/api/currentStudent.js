import { api } from "./api";

// El backend no expone (todavía) un /students/me, y el objeto `user` que guarda
// el login no trae el id de la fila `students`. Resolvemos el alumno logueado
// buscándolo en /students por userId (o por email como fallback) y lo cacheamos
// en memoria para no repetir la búsqueda en cada vista del portal.
let cachedStudent = null;
let cachedForUserId = null;

export function clearCurrentStudentCache() {
  cachedStudent = null;
  cachedForUserId = null;
}

export async function getCurrentStudent(user) {
  if (!user) return null;
  if (cachedStudent && cachedForUserId === user.id) return cachedStudent;

  // Si algún día el login devuelve studentId, esto evita la búsqueda completa.
  if (user.studentId) {
    const { data } = await api.get(`/students/${user.studentId}`);
    cachedStudent = data;
    cachedForUserId = user.id;
    return cachedStudent;
  }

  const { data } = await api.get("/students?size=1000");
  const found =
    data.find((s) => s.userId === user.id) ??
    data.find((s) => s.email && user.email && s.email.toLowerCase() === user.email.toLowerCase());

  if (!found) {
    throw new Error("No encontramos un legajo de alumno asociado a tu usuario.");
  }

  cachedStudent = found;
  cachedForUserId = user.id;
  return cachedStudent;
}
