import { api } from "../../../shared/api/api";

export async function getStudentHistory() {
  const { data } = await api.get("/students/me/history");
  return data;
}
