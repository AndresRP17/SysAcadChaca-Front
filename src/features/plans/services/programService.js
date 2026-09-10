import { api } from "../../../shared/api/api";

export async function getPrograms() {
  // El backend pagina con size=10 por defecto; forzamos un tope alto para
  // no truncar la lista en silencio (no hay UI de paginación todavía).
  const { data } = await api.get("/programs?size=1000");
  return data;
}

export async function createProgram(data) {
  const res = await api.post("/programs", data);
  return res.data;
}

export async function updateProgram(id, data) {
  const res = await api.put(`/programs/${id}`, data);
  return res.data;
}

export async function deleteProgram(id) {
  await api.delete(`/programs/${id}`);
}
