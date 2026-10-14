import { api } from "../../../shared/api/api";
import { cleanParams, toPage } from "../../users/services/pagedList";

// Una página de comisiones filtrada en el servidor: { items, total }.
// state: "active" | "inactive" | "closed" (vacío = todas).
export async function getSectionsPage({ studyPlanId, q, academicYear, term, state, page = 1, size = 10 } = {}) {
  const response = await api.get("/sections", {
    params: cleanParams({
      study_plan_id: studyPlanId,
      q,
      academic_year: academicYear,
      term,
      active: state === "active" ? 1 : state === "inactive" ? 0 : undefined,
      closed: state === "closed" ? 1 : undefined,
      page,
      size,
    }),
  });
  return toPage(response);
}

export async function getSection(id) {
  const { data } = await api.get(`/sections/${id}`);
  return data;
}

export async function getMySections(teacherId, { includeSchedules = false } = {}) {
  const { data } = await api.get(`/sections?teacher_id=${teacherId}&size=1000${includeSchedules ? "&include_schedules=1" : ""}`);
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

export async function closeSection(id) {
  const { data } = await api.post(`/sections/${id}/close`);
  return data;
}
