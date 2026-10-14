import { api } from "../../../shared/api/api";
import { buildParams } from "../../../shared/utils/formatters";
import { cleanParams, toPage } from "../../users/services/pagedList";

export const GRID_SIZE = 1000;

export async function getSectionSchedules(sectionId) {
  const qs = buildParams({ section_id: sectionId, size: 1000 });
  const { data } = await api.get(`/section-schedules?${qs}`);
  return data;
}

// Horarios de un plan (opcionalmente de un año y cuatrimestre) para la grilla semanal: la grilla es una vista de
// calendario y necesita todos los bloques del filtro, por eso no se pagina; { items, total } deja avisar si
// el servidor corto en `size`.
export async function getSchedulesForGrid({ studyPlanId, academicYear, term }) {
  const response = await api.get("/section-schedules", {
    params: cleanParams({ study_plan_id: studyPlanId, academic_year: academicYear, term, size: GRID_SIZE }),
  });
  return toPage(response);
}

export async function createSectionSchedule(data) {
  const res = await api.post("/section-schedules", data);
  return res.data;
}

export async function updateSectionSchedule(id, data) {
  const res = await api.put(`/section-schedules/${id}`, data);
  return res.data;
}

export async function deleteSectionSchedule(id) {
  await api.delete(`/section-schedules/${id}`);
}

export async function getAvailability({ classroomId, teacherId, weekday, startTime, endTime, excludeSectionScheduleId }) {
  const qs = buildParams({
    classroom_id: classroomId,
    teacher_id: teacherId,
    weekday,
    start_time: startTime,
    end_time: endTime,
    exclude_section_schedule_id: excludeSectionScheduleId,
  });
  const { data } = await api.get(`/section-schedules/availability?${qs}`);
  return data;
}
