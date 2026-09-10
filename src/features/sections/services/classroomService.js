import { api } from "../../../shared/api/api";

export async function getClassrooms() {
  const { data } = await api.get("/classrooms?size=1000");
  return data;
}

export async function createClassroom(data) {
  const res = await api.post("/classrooms", data);
  return res.data;
}

export async function updateClassroom(id, data) {
  const res = await api.put(`/classrooms/${id}`, data);
  return res.data;
}

export async function deleteClassroom(id) {
  await api.delete(`/classrooms/${id}`);
}
