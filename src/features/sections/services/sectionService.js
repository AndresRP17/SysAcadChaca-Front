import { api } from "../../../shared/api/api";
import { buildParams } from "../../../shared/utils/formatters";

// Sin filtros trae todas las comisiones (pantallas de Bedel/Admin). El portal del Alumno filtra en el
// servidor por plan de estudio y por activas, y pide los horarios en el mismo pedido.
export async function getSections({ studyPlanId, active, includeSchedules = false } = {}) {
  const qs = buildParams({
    study_plan_id: studyPlanId,
    active: active === undefined ? undefined : active ? 1 : 0,
    include_schedules: includeSchedules ? 1 : undefined,
    size: 1000,
  });
  const { data } = await api.get(`/sections?${qs}`);
  return data;
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
