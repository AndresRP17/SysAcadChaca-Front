import { api } from "../../../shared/api/api";

export async function getAcademicThresholds() {
  const { data } = await api.get("/academic-thresholds");
  return data;
}
