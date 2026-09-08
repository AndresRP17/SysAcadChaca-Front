import { useEffect, useState } from "react";
import { usePrograms } from "./usePrograms";
import { getStudyPlans } from "../services/studyPlanService";

/**
 * Maneja el estado de "elegí una carrera -> elegí uno de sus planes de estudio",
 * compartido entre CurriculumTab y CorrelativesTab.
 */
export function useStudyPlanSelector() {
  const { programs } = usePrograms();

  const [programId, setProgramId] = useState("");
  const [studyPlans, setStudyPlans] = useState([]);
  const [studyPlanId, setStudyPlanId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (programs.length > 0 && !programId) {
      setProgramId(String(programs[0].id));
    }
  }, [programs, programId]);

  async function reloadStudyPlans(forProgramId) {
    if (!forProgramId) {
      setStudyPlans([]);
      return;
    }
    try {
      setStudyPlans(await getStudyPlans(Number(forProgramId)));
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    setStudyPlanId("");
    reloadStudyPlans(programId);
  }, [programId]);

  return {
    programs,
    programId,
    setProgramId,
    studyPlans,
    studyPlanId,
    setStudyPlanId,
    error,
    reloadStudyPlans: () => reloadStudyPlans(programId),
  };
}
