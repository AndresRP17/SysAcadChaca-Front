import { api } from "../../../shared/api/api";
import { buildParams } from "../../../shared/utils/formatters";

export async function getPrerequisites(curriculumCourseId) {
  const qs = buildParams({ curriculum_course_id: curriculumCourseId });
  const { data } = await api.get(`/prerequisites?${qs}`);
  return data;
}

export async function createPrerequisite(data) {
  const res = await api.post("/prerequisites", data);
  return res.data;
}

export async function deletePrerequisite(id) {
  await api.delete(`/prerequisites/${id}`);
}
