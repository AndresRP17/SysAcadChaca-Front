import { api } from "../../../shared/api/api";
import { buildParams } from "../../../shared/utils/formatters";

export async function getStudyPlans(programId) {
  const qs = buildParams({ program_id: programId });
  const { data } = await api.get(`/study-plans?${qs}`);
  return data;
}

export async function createStudyPlan(data) {
  const res = await api.post("/study-plans", data);
  return res.data;
}

export async function updateStudyPlan(id, data) {
  const res = await api.put(`/study-plans/${id}`, data);
  return res.data;
}

export async function deleteStudyPlan(id) {
  await api.delete(`/study-plans/${id}`);
}
