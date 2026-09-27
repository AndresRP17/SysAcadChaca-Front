import { api } from "../../../shared/api/api";

export async function getStudentSummary() {
  const { data } = await api.get("/students/me/summary");
  return data;
}
