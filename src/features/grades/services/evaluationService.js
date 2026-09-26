import { api } from "../../../shared/api/api";

export async function getEvaluationsBySection(sectionId) {
  const { data } = await api.get(`/evaluations?section_id=${sectionId}&size=1000`);
  return data;
}

export async function createEvaluation(payload) {
  const { data } = await api.post("/evaluations", payload);
  return data;
}
