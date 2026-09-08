import { api } from "../../../shared/api/api";

export async function getPrograms() {
  const { data } = await api.get("/programs");
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
