import { useEffect, useState } from "react";
import { getEnrollmentPeriods } from "../../sections/services/enrollmentPeriodService";

// Períodos de inscripción vigentes hoy para un tipo (CURSADA o FINAL). Mientras
// carga se considera abierto para no bloquear la pantalla con un falso cierre;
// el backend es quien decide de verdad.
export function useOpenEnrollmentPeriods(type) {
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getEnrollmentPeriods({ type, open: true })
      .then((data) => {
        if (!cancelled) setPeriods(data);
      })
      .catch(() => {
        if (!cancelled) setPeriods([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [type]);

  return { periods, loading, isOpen: loading || periods.length > 0 };
}
