import { api } from "../../../shared/api/api";

export async function getAttendancesBySectionAndDate(sectionId, date) {
  const { data } = await api.get(`/attendances?section_id=${sectionId}&date=${date}&size=1000`);
  return data;
}

// Todas las asistencias ya cargadas de la comision, sin filtrar por fecha —
// se usa para armar la lista de "fechas ya tomadas" por clase.
export async function getAttendancesBySection(sectionId) {
  const { data } = await api.get(`/attendances?section_id=${sectionId}&size=1000`);
  return data;
}

export async function createAttendance(payload) {
  const { data } = await api.post("/attendances", payload);
  return data;
}

export async function updateAttendance(id, payload) {
  const { data } = await api.put(`/attendances/${id}`, payload);
  return data;
}

// Guarda la asistencia de toda la clase en un solo pedido (transaccional e idempotente en el
// backend: sirve para crear y para editar, y reintentar es seguro). records: [{ enrollment_id, present }].
export async function saveAttendanceBatch({ sectionId, date, records }) {
  const { data } = await api.post("/attendances/batch", { section_id: sectionId, date, records });
  return data;
}
