import { api } from "../../../shared/api/api";

export async function getStudents() {
  const { data } = await api.get("/students");
  return data;
}

export async function createStudent(data) {
  const res = await api.post("/students", data);
  return res.data;
}

export async function updateStudent(id, data) {
  const res = await api.put(`/students/${id}`, data);
  return res.data;
}

export async function deleteStudent(id) {
  await api.delete(`/students/${id}`);
}
