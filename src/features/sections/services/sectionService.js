import { api } from "../../../shared/api/api";

export async function getSections() {
  const { data } = await api.get("/sections?size=1000");
  return data;
}

export async function createSection(data) {
  const res = await api.post("/sections", data);
  return res.data;
}

export async function updateSection(id, data) {
  const res = await api.put(`/sections/${id}`, data);
  return res.data;
}

export async function deleteSection(id) {
  await api.delete(`/sections/${id}`);
}
