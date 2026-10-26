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
// backend: sirve para crear y para editar, y reintentar es seguro). records: [{ enrollment_id, status, comment? }].
export async function saveAttendanceBatch({ sectionId, date, records }) {
  const { data } = await api.post("/attendances/batch", { section_id: sectionId, date, records });
  return data;
}

// Reglas institucionales de asistencia: cuanto cuenta "llego tarde" y "se retiro antes"
// (1 = presente, 0.5 = media falta, 0 = falta). Las lee cualquier usuario; las edita el Administrador.
export async function getAttendanceRules() {
  const { data } = await api.get("/attendance-rules");
  return data;
}

// lateAuditDays: dias de atraso a partir de los cuales cargar la asistencia de una clase queda en la auditoria
// (cambiar una asistencia ya guardada se audita siempre). Sin el valor, el servidor conserva el actual.
export async function updateAttendanceRules({ lateCredit, leftEarlyCredit, lateAuditDays }) {
  const { data } = await api.put("/attendance-rules", {
    late_credit: lateCredit,
    left_early_credit: leftEarlyCredit,
    ...(lateAuditDays === undefined ? {} : { late_audit_days: lateAuditDays }),
  });
  return data;
}
