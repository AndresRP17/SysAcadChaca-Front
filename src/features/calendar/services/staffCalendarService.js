import { api } from "../../../shared/api/api";
import { buildParams } from "../../../shared/utils/formatters";

// Filtros del calendario de Bedel/Administrador (todos opcionales).
function filterParams(filters = {}) {
  return {
    section_id: filters.sectionId,
    program_id: filters.programId,
    study_plan_id: filters.studyPlanId,
    classroom_id: filters.classroomId,
    teacher_id: filters.teacherId,
  };
}

// Clases de un rango (YYYY-MM-DD) con filtros. Devuelve { events, missingTerms }.
export async function getFilteredCalendar(from, to, filters) {
  const qs = buildParams({ from, to, ...filterParams(filters) });
  const { data } = await api.get(`/calendar?${qs}`);
  return data;
}

// Resumen por dia para pintar el mes: { days: [{ date, classes, cancelled, holiday }], missingTerms }.
export async function getCalendarSummary(from, to, filters) {
  const qs = buildParams({ from, to, ...filterParams(filters) });
  const { data } = await api.get(`/calendar/summary?${qs}`);
  return data;
}

export async function getCancelledClasses(sectionId) {
  const { data } = await api.get(`/cancelled-classes?section_id=${sectionId}`);
  return data;
}

export async function createCancelledClass(sectionId, date, reason) {
  const { data } = await api.post("/cancelled-classes", { section_id: sectionId, date, reason });
  return data;
}

export async function deleteCancelledClass(id) {
  await api.delete(`/cancelled-classes/${id}`);
}

// Fechas de cursado (cuatrimestres).
export async function getAcademicTerms() {
  const { data } = await api.get("/academic-terms");
  return data;
}

export async function createAcademicTerm(payload) {
  const { data } = await api.post("/academic-terms", payload);
  return data;
}

export async function deleteAcademicTerm(id) {
  await api.delete(`/academic-terms/${id}`);
}

// Feriados / dias sin actividad.
export async function getNonTeachingDays() {
  const { data } = await api.get("/non-teaching-days");
  return data;
}

export async function createNonTeachingDay(payload) {
  const { data } = await api.post("/non-teaching-days", payload);
  return data;
}

export async function deleteNonTeachingDay(id) {
  await api.delete(`/non-teaching-days/${id}`);
}
