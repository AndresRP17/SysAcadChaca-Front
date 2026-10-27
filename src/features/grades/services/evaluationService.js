import { api } from "../../../shared/api/api";
import { buildParams } from "../../../shared/utils/formatters";

export const EVALUATION_TYPES = [
  { value: "PARCIAL", label: "Parcial" },
  { value: "RECUPERATORIO", label: "Recuperatorio" },
  { value: "TRABAJO_PRACTICO", label: "Trabajo práctico" },
];

export function evaluationTypeLabel(type) {
  return EVALUATION_TYPES.find((t) => t.value === type)?.label ?? type;
}

export async function getEvaluationsBySection(sectionId) {
  const { data } = await api.get(`/evaluations?section_id=${sectionId}&size=1000`);
  return data;
}

export async function createEvaluation(payload) {
  const { data } = await api.post("/evaluations", payload);
  return data;
}

export async function updateEvaluation(id, payload) {
  const { data } = await api.put(`/evaluations/${id}`, payload);
  return data;
}

export async function deleteEvaluation(id) {
  await api.delete(`/evaluations/${id}`);
}

// Avisos antes de guardar (fuera del cuatrimestre, fecha pasada, poca anticipación, choques con otras
// materias). No bloquean nada: { warnings: [{ code, message }], conflicts: [{ evaluationId, name, ... }] }.
export async function checkEvaluation({ sectionId, date, type, evaluationId }) {
  const qs = buildParams({ section_id: sectionId, date, type, evaluation_id: evaluationId });
  const { data } = await api.get(`/evaluations/check?${qs}`);
  return data;
}
