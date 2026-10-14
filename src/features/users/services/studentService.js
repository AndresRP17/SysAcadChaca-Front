import { api } from "../../../shared/api/api";
import { cleanParams, toPage } from "./pagedList";

export async function getStudents() {
  const { data } = await api.get("/students?size=1000");
  return data;
}

export async function getStudent(id) {
  const { data } = await api.get(`/students/${id}`);
  return data;
}

// Una página de alumnos filtrada en el servidor: { items, total }.
export async function getStudentsPage({ q, programId, active, page = 1, size = 10 } = {}) {
  const response = await api.get("/students", {
    params: cleanParams({ q, program_id: programId, active, page, size }),
  });
  return toPage(response);
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
