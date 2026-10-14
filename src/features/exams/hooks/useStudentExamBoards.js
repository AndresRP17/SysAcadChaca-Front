import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { getCurrentStudent } from "../../../shared/api/currentStudent";
import { getStudent } from "../../users/services/studentService";
import { getErrorMessage } from "../../../shared/api/api";
import { getExamBoard, getExamBoards } from "../services/examBoardService";
import {
  getExamEnrollments,
  createExamEnrollment,
  deleteExamEnrollment,
} from "../services/examEnrollmentService";
import { isPast } from "../../../shared/utils/formatters";

// Mesas de examen que le corresponden al alumno (las de las materias de su
// plan) separadas en "disponibles" y "mis inscripciones", igual que el portal
// de cursadas.
export function useStudentExamBoards(studentIdOverride) {
  const { user } = useAuth();

  const [student, setStudent] = useState(null);
  const [boards, setBoards] = useState([]);
  const [myEnrollments, setMyEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const currentStudent = studentIdOverride
        ? await getStudent(studentIdOverride)
        : await getCurrentStudent(user);
      setStudent(currentStudent);

      // El servidor ya devuelve solo las mesas de las materias del plan del alumno.
      const [boardsData, enrollmentsData] = await Promise.all([
        getExamBoards({ studyPlanId: currentStudent?.studyPlanId }),
        getExamEnrollments({ studentId: currentStudent.id }),
      ]);

      // Una inscripción vieja puede ser a una mesa de otro plan (el alumno cambió de plan):
      // esas mesas no vienen en la lista filtrada y se piden de a una.
      const knownBoardIds = new Set(boardsData.map((b) => b.id));
      const missingBoardIds = [...new Set(enrollmentsData.map((e) => e.examBoardId))].filter((id) => !knownBoardIds.has(id));
      const extraBoards = await Promise.all(missingBoardIds.map((id) => getExamBoard(id).catch(() => null)));

      setBoards([...boardsData, ...extraBoards.filter(Boolean)]);
      setMyEnrollments(enrollmentsData);
    } catch (e) {
      setLoadError(getErrorMessage(e, "No pudimos cargar las mesas de examen."));
    } finally {
      setLoading(false);
    }
  }, [user, studentIdOverride]);

  useEffect(() => {
    reload();
  }, [reload]);

  const enrolled = useMemo(() => {
    return myEnrollments
      .map((enrollment) => ({
        enrollment,
        board: boards.find((b) => b.id === enrollment.examBoardId) ?? null,
      }))
      .filter((item) => item.board !== null)
      .sort((a, b) => String(a.board.scheduledAt).localeCompare(String(b.board.scheduledAt)));
  }, [myEnrollments, boards]);

  const available = useMemo(() => {
    const enrolledBoardIds = new Set(myEnrollments.map((e) => e.examBoardId));

    return boards
      .filter((b) => !enrolledBoardIds.has(b.id))
      .filter((b) => !isPast(b.scheduledAt))
      .filter((b) => !b.cancelled)
      .sort((a, b) => String(a.scheduledAt).localeCompare(String(b.scheduledAt)));
  }, [boards, myEnrollments]);

  async function enroll(examBoardId) {
    await createExamEnrollment({ examBoardId, studentId: student.id });
    await reload();
  }

  async function unenroll(examEnrollmentId) {
    await deleteExamEnrollment(examEnrollmentId);
    await reload();
  }

  return { student, available, enrolled, loading, error, setError, loadError, enroll, unenroll, reload };
}
