import { api } from "../../../shared/api/api";

export async function getCourses() {
  const { data } = await api.get("/courses");
  return data;
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
