import { api } from "../../../shared/api/api";

export async function getTeachers() {
  const { data } = await api.get("/teachers?size=1000");
  return data;
}

// Para cuando el que pregunta es el propio Docente logueado (no puede pedir
// getTeachers(), esa lista esta restringida a Administrador/Bedel).
export async function getMyTeacherProfile() {
  const { data } = await api.get("/teachers/me");
  return data;
}

// El perfil de docente (id, legajo, título) de un usuario; null si no tiene.
export async function getTeacherByUserId(userId) {
  const { data } = await api.get(`/teachers?user_id=${userId}`);
  return data[0] ?? null;
}

export async function createTeacher(data) {
  const res = await api.post("/teachers", data);
  return res.data;
}

export async function updateTeacher(id, data) {
  const res = await api.put(`/teachers/${id}`, data);
  return res.data;
}

export async function deleteTeacher(id) {
  await api.delete(`/teachers/${id}`);
}
