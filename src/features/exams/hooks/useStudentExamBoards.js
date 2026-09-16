import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { getCurrentStudent } from "../../../shared/api/currentStudent";
import { getErrorMessage } from "../../../shared/api/api";
import { getCurriculumCourses } from "../../plans/services/curriculumCourseService";
import { getExamBoards } from "../services/examBoardService";
import {
  getExamEnrollments,
  createExamEnrollment,
  deleteExamEnrollment,
} from "../services/examEnrollmentService";
import { isPast } from "../../../shared/utils/formatters";

// Mesas de examen que le corresponden al alumno (las de las materias de su
// plan) separadas en "disponibles" y "mis inscripciones", igual que el portal
// de cursadas.
export function useStudentExamBoards() {
  const { user } = useAuth();

  const [student, setStudent] = useState(null);
  const [boards, setBoards] = useState([]);
  const [myEnrollments, setMyEnrollments] = useState([]);
  const [curriculumCourseIds, setCurriculumCourseIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const currentStudent = await getCurrentStudent(user);
      setStudent(currentStudent);

      const [boardsData, enrollmentsData] = await Promise.all([
        getExamBoards(),
        getExamEnrollments({ studentId: currentStudent.id }),
      ]);

      setBoards(boardsData);
      setMyEnrollments(enrollmentsData);

      if (currentStudent?.studyPlanId) {
        const curriculumCourses = await getCurriculumCourses(currentStudent.studyPlanId);
        setCurriculumCourseIds(curriculumCourses.map((cc) => cc.id));
      } else {
        setCurriculumCourseIds([]);
      }
    } catch (e) {
      setError(getErrorMessage(e, "No pudimos cargar las mesas de examen."));
    } finally {
      setLoading(false);
    }
  }, [user]);

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
    const planCourseIds = new Set(curriculumCourseIds);
    const enrolledBoardIds = new Set(myEnrollments.map((e) => e.examBoardId));

    return boards
      .filter((b) => planCourseIds.size === 0 || planCourseIds.has(b.curriculumCourseId))
      .filter((b) => !enrolledBoardIds.has(b.id))
      .filter((b) => !isPast(b.scheduledAt))
      .sort((a, b) => String(a.scheduledAt).localeCompare(String(b.scheduledAt)));
  }, [boards, curriculumCourseIds, myEnrollments]);

  async function enroll(examBoardId) {
    await createExamEnrollment({ examBoardId, studentId: student.id });
    await reload();
  }

  async function unenroll(examEnrollmentId) {
    await deleteExamEnrollment(examEnrollmentId);
    await reload();
  }

  return { student, available, enrolled, loading, error, setError, enroll, unenroll, reload };
}
