import { api } from "../../../shared/api/api";

export async function getGradesByEvaluation(evaluationId) {
  const { data } = await api.get(`/evaluation-grades?evaluation_id=${evaluationId}&size=1000`);
  return data;
}

export async function createGrade(payload) {
  const { data } = await api.post("/evaluation-grades", payload);
  return data;
}

export async function updateGrade(id, payload) {
  const { data } = await api.put(`/evaluation-grades/${id}`, payload);
  return data;
}
