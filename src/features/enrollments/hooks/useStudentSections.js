import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { getCurrentStudent } from "../../../shared/api/currentStudent";
import { getErrorMessage } from "../../../shared/api/api";
import { getSections } from "../../sections/services/sectionService";
import { getAllSectionSchedules } from "../../sections/services/sectionScheduleService";
import { getCurriculumCourses } from "../../plans/services/curriculumCourseService";
import { getEnrollments, createEnrollment, deleteEnrollment } from "../services/enrollmentService";

// Carga todo lo que necesita el portal del alumno y lo deja armado en dos
// listas separadas: la oferta a la que se puede inscribir y las comisiones en
// las que ya está inscripto. El backend no tiene un endpoint que devuelva la
// oferta ya filtrada, así que traemos comisiones + horarios + inscripciones y
// cruzamos acá (son pocos registros, van todos con size=1000).
export function useStudentSections() {
  const { user } = useAuth();

  const [student, setStudent] = useState(null);
  const [sections, setSections] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [allEnrollments, setAllEnrollments] = useState([]);
  const [curriculumCourseIds, setCurriculumCourseIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const currentStudent = await getCurrentStudent(user);
      setStudent(currentStudent);

      const [sectionsData, schedulesData, enrollmentsData] = await Promise.all([
        getSections(),
        getAllSectionSchedules(),
        getEnrollments(),
      ]);

      setSections(sectionsData);
      setSchedules(schedulesData);
      setAllEnrollments(enrollmentsData);

      // El alumno solo debería ver comisiones de las materias de su plan.
      if (currentStudent?.studyPlanId) {
        const curriculumCourses = await getCurriculumCourses(currentStudent.studyPlanId);
        setCurriculumCourseIds(curriculumCourses.map((cc) => cc.id));
      } else {
        setCurriculumCourseIds([]);
      }
    } catch (e) {
      setError(getErrorMessage(e, "No pudimos cargar la oferta de cursadas."));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    reload();
  }, [reload]);

  const schedulesBySection = useMemo(() => {
    const map = new Map();
    schedules.forEach((sch) => {
      if (!map.has(sch.sectionId)) map.set(sch.sectionId, []);
      map.get(sch.sectionId).push(sch);
    });
    return map;
  }, [schedules]);

  // Cuántos inscriptos tiene cada comisión, para mostrar el cupo restante.
  const countsBySection = useMemo(() => {
    const map = new Map();
    allEnrollments.forEach((e) => {
      map.set(e.sectionId, (map.get(e.sectionId) ?? 0) + 1);
    });
    return map;
  }, [allEnrollments]);

  const myEnrollments = useMemo(
    () => (student ? allEnrollments.filter((e) => e.studentId === student.id) : []),
    [allEnrollments, student],
  );

  const enrolled = useMemo(() => {
    return myEnrollments
      .map((enrollment) => ({
        enrollment,
        section: sections.find((s) => s.id === enrollment.sectionId) ?? null,
        schedules: schedulesBySection.get(enrollment.sectionId) ?? [],
      }))
      .filter((item) => item.section !== null);
  }, [myEnrollments, sections, schedulesBySection]);

  const available = useMemo(() => {
    const planCourseIds = new Set(curriculumCourseIds);
    const enrolledSectionIds = new Set(myEnrollments.map((e) => e.sectionId));
    // Ya inscripto en otra comisión de la misma materia: no debería poder
    // anotarse dos veces en la misma materia.
    const enrolledCourseIds = new Set(
      enrolled.map((item) => item.section.curriculumCourseId),
    );

    return sections
      .filter((s) => planCourseIds.size === 0 || planCourseIds.has(s.curriculumCourseId))
      .filter((s) => !enrolledSectionIds.has(s.id))
      .filter((s) => !enrolledCourseIds.has(s.curriculumCourseId))
      .map((section) => {
        const taken = countsBySection.get(section.id) ?? 0;
        return {
          section,
          schedules: schedulesBySection.get(section.id) ?? [],
          taken,
          remaining: Math.max((section.maxCapacity ?? 0) - taken, 0),
        };
      });
  }, [sections, curriculumCourseIds, myEnrollments, enrolled, countsBySection, schedulesBySection]);

  async function enroll(sectionId) {
    await createEnrollment({ studentId: student.id, sectionId });
    await reload();
  }

  async function unenroll(enrollmentId) {
    await deleteEnrollment(enrollmentId);
    await reload();
  }

  return { student, available, enrolled, loading, error, setError, enroll, unenroll, reload };
}
