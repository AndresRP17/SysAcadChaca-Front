import { useEffect, useMemo, useState } from "react";
import { getPrograms } from "../plans/services/programService";
import { getStudyPlans } from "../plans/services/studyPlanService";
import { getCurriculumCourses } from "../plans/services/curriculumCourseService";
import { getClassrooms } from "../sections/services/classroomService";
import { getTeachers } from "../users/services/teacherService";
import { getSections } from "../sections/services/sectionService";

// Listas para los filtros del calendario de Bedel/Administrador y un indice
// comision -> carrera/plan/docente para agrupar las clases del dia. El evento del
// calendario solo trae sectionId, asi que el resto se resuelve aca (una sola carga).
export function useCalendarCatalog() {
  const [data, setData] = useState({
    programs: [],
    studyPlans: [],
    classrooms: [],
    teachers: [],
    sections: [],
    curriculumToPlan: {},
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [programs, studyPlans, classrooms, teachers, sections] = await Promise.all([
        getPrograms(),
        getStudyPlans(),
        getClassrooms(),
        getTeachers(),
        getSections(),
      ]);

      const curricula = await Promise.all(
        studyPlans.map((plan) => getCurriculumCourses(plan.id).then((list) => [plan.id, list])),
      );
      const curriculumToPlan = {};
      for (const [planId, list] of curricula) {
        for (const cc of list) curriculumToPlan[cc.id] = planId;
      }

      if (!cancelled) {
        setData({ programs, studyPlans, classrooms, teachers, sections, curriculumToPlan });
        setLoading(false);
      }
    }

    load().catch(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  // sectionId -> { section, plan, program } (plan/program pueden faltar si el dato no se pudo resolver).
  const bySectionId = useMemo(() => {
    const plans = new Map(data.studyPlans.map((p) => [p.id, p]));
    const programs = new Map(data.programs.map((p) => [p.id, p]));
    const index = new Map();

    for (const section of data.sections) {
      const plan = plans.get(data.curriculumToPlan[section.curriculumCourseId]);
      index.set(section.id, { section, plan, program: plan ? programs.get(plan.programId) : undefined });
    }
    return index;
  }, [data]);

  return { ...data, bySectionId, loading };
}
