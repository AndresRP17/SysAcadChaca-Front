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

export async function updateExamBoard(id, data) {
  const res = await api.put(`/exam-boards/${id}`, data);
  return res.data;
}

// Cierra el acta: registra libro y folio y la deja de solo lectura. El backend
// valida que la mesa ya se rindió y que no queden resultados pendientes.
export async function closeExamBoard(id, { record_book, record_folio }) {
  const res = await api.post(`/exam-boards/${id}/close`, { record_book, record_folio });
  return res.data;
}

export async function deleteExamBoard(id) {
  await api.delete(`/exam-boards/${id}`);
}

// Cancela una mesa que ya tiene alumnos inscriptos: el backend marca todas sus
// inscripciones como 'cancelled' con el motivo dado (como hace SIU-Guarani,
// que no tiene "desactivar mesa" sino un rechazo masivo). La mesa no se borra,
// queda como registro histórico visible para el alumno.
export async function cancelExamBoard(id, reason) {
  const res = await api.post(`/exam-boards/${id}/cancel`, { reason });
  return res.data;
}
