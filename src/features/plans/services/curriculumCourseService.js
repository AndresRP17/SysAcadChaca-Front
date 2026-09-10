import { api } from "../../../shared/api/api";
import { buildParams } from "../../../shared/utils/formatters";

export async function getCurriculumCourses(studyPlanId) {
  const qs = buildParams({ study_plan_id: studyPlanId, size: 1000 });
  const { data } = await api.get(`/curriculum-courses?${qs}`);
  return data;
}

export async function assignCourse(data) {
  const res = await api.post("/curriculum-courses", data);
  return res.data;
}

export async function unassignCourse(id) {
  await api.delete(`/curriculum-courses/${id}`);
}
