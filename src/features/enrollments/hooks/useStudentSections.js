import { useCallback, useEffect, useMemo, useState } from "react";
import { getErrorMessage } from "../../../shared/api/api";
import { getEnrollableSections, createEnrollment, deleteEnrollment } from "../services/enrollmentService";

// Carga lo que necesita el portal del alumno con UN pedido: el servidor decide con las mismas reglas
// que la inscripción (plan, correlativas, cupo, horarios, materia ya aprobada, período) y devuelve las
// comisiones ya filtradas, más las comisiones donde el alumno ya está inscripto (con enrollmentId).
// Con studentIdOverride (Bedel / Administrador) pide también las bloqueadas con sus motivos.
export function useStudentSections(studentIdOverride) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      setItems(
        await getEnrollableSections({
          studentId: studentIdOverride,
          includeBlocked: Boolean(studentIdOverride),
          includeEnrolled: true,
        }),
      );
    } catch (e) {
      setLoadError(getErrorMessage(e, "No pudimos cargar la oferta de cursadas."));
    } finally {
      setLoading(false);
    }
  }, [studentIdOverride]);

  useEffect(() => {
    reload();
  }, [reload]);

  // "Mis cursadas": las comisiones con inscripción activa.
  const enrolled = useMemo(
    () =>
      items
        .filter((s) => s.enrollmentId != null)
        .map((section) => ({
          enrollment: { id: section.enrollmentId, sectionId: section.id, studentId: studentIdOverride, status: "active" },
          section,
          schedules: section.schedules ?? [],
        })),
    [items, studentIdOverride],
  );

  // La oferta: cada comisión trae enrollable y blockedReasons (para el Alumno son todas habilitadas).
  const available = useMemo(
    () => items.filter((s) => s.enrollmentId == null).map((section) => ({ section, schedules: section.schedules ?? [] })),
    [items],
  );

  // extras (solo Bedel / Administrador): { outOfTerm: { reason }, retake: { reason } }.
  async function enroll(sectionId, { outOfTerm = null, retake = null } = {}) {
    // Sin studentId el backend inscribe al alumno logueado.
    await createEnrollment({ studentId: studentIdOverride, sectionId, outOfTerm, retake });
    await reload();
  }

  async function unenroll(enrollmentId) {
    await deleteEnrollment(enrollmentId);
    await reload();
  }

  return { available, enrolled, loading, error, setError, loadError, enroll, unenroll, reload };
}
