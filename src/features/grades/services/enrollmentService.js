import { api } from "../../../shared/api/api";

export async function getEnrollmentsBySection(sectionId) {
  const { data } = await api.get(`/enrollments?section_id=${sectionId}&size=1000`);
  return data;
}
