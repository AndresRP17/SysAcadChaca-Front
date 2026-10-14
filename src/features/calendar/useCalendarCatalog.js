import { useEffect, useState } from "react";
import { getPrograms } from "../plans/services/programService";
import { getStudyPlans } from "../plans/services/studyPlanService";
import { getClassrooms } from "../sections/services/classroomService";

// Listas para los filtros del calendario de Bedel/Administrador. Antes tambien armaba un
// indice comision -> carrera/plan/docente con un pedido por plan de estudio (72 pedidos y
// ~11 s con 253 comisiones): ahora cada evento del calendario ya trae esos datos
// (programId, programName, studyPlanId, resolutionYear, teacherName), ver `eventInfo`.
export function useCalendarCatalog() {
  const [data, setData] = useState({ programs: [], studyPlans: [], classrooms: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    Promise.all([getPrograms(), getStudyPlans(), getClassrooms()])
      .then(([programs, studyPlans, classrooms]) => {
        if (!cancelled) setData({ programs, studyPlans, classrooms });
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { ...data, loading };
}

// Carrera, plan y docente de una clase, a partir del evento del calendario (sin pedidos extra).
// Misma forma que usaban ClassSheet y el agrupado por carrera: { program, plan, teacherName }.
export function eventInfo(event) {
  if (!event) return undefined;

  return {
    program: event.programId ? { id: event.programId, name: event.programName } : undefined,
    plan: event.studyPlanId ? { id: event.studyPlanId, resolutionYear: event.resolutionYear, programName: event.programName } : undefined,
    teacherName: event.teacherName ?? null,
  };
}
