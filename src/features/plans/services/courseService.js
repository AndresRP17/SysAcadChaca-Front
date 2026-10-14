import { api } from "../../../shared/api/api";
import { cleanParams, toPage } from "../../users/services/pagedList";

export async function getCourses() {
  const { data } = await api.get("/courses?size=1000");
  return data;
}

// Una página de materias filtrada en el servidor (q busca por nombre o código): { items, total }.
export async function getCoursesPage({ q, page = 1, size = 10 } = {}) {
  const response = await api.get("/courses", { params: cleanParams({ q, page, size }) });
  return toPage(response);
}

export async function createCourse(data) {
  const res = await api.post("/courses", data);
  return res.data;
}

export async function updateCourse(id, data) {
  const res = await api.put(`/courses/${id}`, data);
  return res.data;
}

export async function deleteCourse(id) {
  await api.delete(`/courses/${id}`);
}
