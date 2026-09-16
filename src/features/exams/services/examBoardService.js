import { api } from "../../../shared/api/api";
import { buildParams } from "../../../shared/utils/formatters";

export async function getExamBoards({ curriculumCourseId } = {}) {
  const qs = buildParams({ curriculum_course_id: curriculumCourseId, size: 1000 });
  const { data } = await api.get(`/exam-boards?${qs}`);
  return data;
}

export async function createExamBoard(data) {
  const res = await api.post("/exam-boards", data);
  return res.data;
}

// Se usa para cerrar el acta: guarda libro y folio en la mesa.
export async function updateExamBoard(id, data) {
  const res = await api.put(`/exam-boards/${id}`, data);
  return res.data;
}

export async function deleteExamBoard(id) {
  await api.delete(`/exam-boards/${id}`);
}
