import { api } from "../../../shared/api/api";

// Reglas institucionales de evaluaciones: horas mínimas entre parciales y recuperatorios de materias del mismo año
// de la carrera y de años distintos, y días de aviso para cambiar una fecha. Las leen Administrador, Bedel y
// Docente; las edita el Administrador. Cero desactiva el aviso correspondiente.
export const EVALUATION_RULES_LIMITS = { hours: { min: 0, max: 720 }, noticeDays: { min: 0, max: 365 } };

export async function getEvaluationRules() {
  const { data } = await api.get("/evaluation-rules");
  return data;
}

export async function updateEvaluationRules({ minHoursSameYear, minHoursOtherYear, minNoticeDays }) {
  const { data } = await api.put("/evaluation-rules", {
    min_hours_same_year: minHoursSameYear,
    min_hours_other_year: minHoursOtherYear,
    min_notice_days: minNoticeDays,
  });
  return data;
}
