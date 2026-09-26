import { api } from "../../../shared/api/api";
import { buildParams } from "../../../shared/utils/formatters";

// Estados de exam_enrollments.status. Si el backend los nombró distinto,
// cambiarlos acá alcanza para toda la feature.
export const EXAM_ENROLLMENT_STATUS = {
  PENDING: "pending",
  PRESENT: "present",
  ABSENT: "absent",
};

export const PASSING_GRADE = 6;

export function getResultStatus(enrollment) {
  if (enrollment.status === EXAM_ENROLLMENT_STATUS.ABSENT) return "absent";
  if (enrollment.status === EXAM_ENROLLMENT_STATUS.PRESENT) {
    return enrollment.finalGrade != null && enrollment.finalGrade >= PASSING_GRADE ? "passed" : "failed";
  }
  return "pending";
}

const RESULT_LABEL = {
  pending: "Pendiente",
  absent: "Ausente",
  passed: "Aprobado",
  failed: "Desaprobado",
};

export function getResultLabel(enrollment) {
  return RESULT_LABEL[getResultStatus(enrollment)];
}

export async function getExamEnrollments({ examBoardId, studentId } = {}) {
  const qs = buildParams({ exam_board_id: examBoardId, student_id: studentId, size: 1000 });
  const { data } = await api.get(`/exam-enrollments?${qs}`);
  return data;
}

export async function createExamEnrollment({ examBoardId, studentId }) {
  const res = await api.post("/exam-enrollments", {
    exam_board_id: examBoardId,
    student_id: studentId,
  });
  return res.data;
}

export async function updateExamEnrollment(id, { finalGrade, status }) {
  const res = await api.put(`/exam-enrollments/${id}/result`, {
    final_grade: finalGrade,
    status,
  });
  return res.data;
}

export async function deleteExamEnrollment(id) {
  await api.delete(`/exam-enrollments/${id}`);
}
