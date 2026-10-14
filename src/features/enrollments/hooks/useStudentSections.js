import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { getCurrentStudent } from "../../../shared/api/currentStudent";
import { getStudent } from "../../users/services/studentService";
import { getErrorMessage } from "../../../shared/api/api";
import { getSection, getSections } from "../../sections/services/sectionService";
import { getEnrollments, createEnrollment, deleteEnrollment } from "../services/enrollmentService";

// TEMPORAL: el backend todavía no tiene GET /enrollments. Mientras tanto, si
// responde 404 lo tratamos como "sin inscripciones" para que el resto de la
// pantalla cargue. Cuando el endpoint exista, esto deja de activarse solo y
// se puede borrar.
async function getEnrollmentsSafe() {
  try {
    return await getEnrollments();
  } catch (e) {
    if (e?.response?.status === 404) return [];
    throw e;
  }
}

// Carga todo lo que necesita el portal del alumno y lo deja armado en dos
// listas separadas: la oferta a la que se puede inscribir y las comisiones en
// las que ya está inscripto. El backend no tiene un endpoint que devuelva la
// oferta ya filtrada, así que traemos comisiones (con availableSeats calculado
// por el backend) + horarios + inscripciones y cruzamos acá (son pocos registros, van todos con size=1000).
export function useStudentSections(studentIdOverride) {
  const { user } = useAuth();

  const [student, setStudent] = useState(null);
  const [sections, setSections] = useState([]);
  const [allEnrollments, setAllEnrollments] = useState([]);
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

      // El servidor devuelve solo las comisiones activas de las materias del plan del alumno,
      // con sus horarios, en un único pedido.
      const [sectionsData, enrollmentsData] = await Promise.all([
        getSections({ studyPlanId: currentStudent?.studyPlanId, active: true, includeSchedules: true }),
        getEnrollmentsSafe(),
      ]);

      // Una inscripción activa puede ser a una comisión que ya no entra en ese filtro (otro plan o
      // comisión dada de baja): se pide aparte para que "Mis cursadas" la siga mostrando.
      const knownSectionIds = new Set(sectionsData.map((s) => s.id));
      const missingSectionIds = [
        ...new Set(
          enrollmentsData
            .filter((e) => e.studentId === currentStudent?.id && e.status === "active")
            .map((e) => e.sectionId)
            .filter((id) => !knownSectionIds.has(id)),
        ),
      ];
      // (GET /sections/{id} no trae los horarios: esa comisión se muestra sin ellos.)
      const extraSections = await Promise.all(
        missingSectionIds.map((id) => getSection(id).then((s) => ({ ...s, schedules: s.schedules ?? [] })).catch(() => null)),
      );

      setSections([...sectionsData, ...extraSections.filter(Boolean)]);
      setAllEnrollments(enrollmentsData);
    } catch (e) {
      setLoadError(getErrorMessage(e, "No pudimos cargar la oferta de cursadas."));
    } finally {
      setLoading(false);
    }
  }, [user, studentIdOverride]);

  useEffect(() => {
    reload();
  }, [reload]);

  // Los horarios vienen dentro de cada comisión (include_schedules).
  const schedulesBySection = useMemo(() => {
    const map = new Map();
    sections.forEach((section) => map.set(section.id, section.schedules ?? []));
    return map;
  }, [sections]);

  const myEnrollments = useMemo(
    () => (student ? allEnrollments.filter((e) => e.studentId === student.id) : []),
    [allEnrollments, student],
  );

  // GET /enrollments devuelve todas las inscripciones del alumno, incluidas
  // las dadas de baja (status "dropped"). Para "¿en qué está inscripto ahora?"
  // solo cuentan las activas -- si no, una comisión de la que se dio de baja
  // sigue bloqueando tanto "Mis cursadas" (le queda el botón de baja de nuevo)
  // como la oferta (no puede volver a anotarse ahí ni en ninguna otra
  // comisión de la misma materia).
  const activeEnrollments = useMemo(
    () => myEnrollments.filter((e) => e.status === "active"),
    [myEnrollments],
  );

  const enrolled = useMemo(() => {
    return activeEnrollments
      .map((enrollment) => ({
        enrollment,
        section: sections.find((s) => s.id === enrollment.sectionId) ?? null,
        schedules: schedulesBySection.get(enrollment.sectionId) ?? [],
      }))
      .filter((item) => item.section !== null);
  }, [activeEnrollments, sections, schedulesBySection]);

  const available = useMemo(() => {
    const enrolledSectionIds = new Set(activeEnrollments.map((e) => e.sectionId));
    // Ya inscripto en otra comisión de la misma materia: no debería poder
    // anotarse dos veces en la misma materia.
    const enrolledCourseIds = new Set(
      enrolled.map((item) => item.section.curriculumCourseId),
    );

    return sections
      .filter((s) => s.active)
      .filter((s) => !enrolledSectionIds.has(s.id))
      .filter((s) => !enrolledCourseIds.has(s.curriculumCourseId))
      .map((section) => ({
        section,
        schedules: schedulesBySection.get(section.id) ?? [],
      }));
  }, [sections, activeEnrollments, enrolled, schedulesBySection]);

  async function enroll(sectionId) {
    await createEnrollment({ studentId: student.id, sectionId });
    await reload();
  }

  async function unenroll(enrollmentId) {
    await deleteEnrollment(enrollmentId);
    await reload();
  }

  return { student, available, enrolled, loading, error, setError, loadError, enroll, unenroll, reload };
}