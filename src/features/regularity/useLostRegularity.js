import { useCallback, useEffect, useState } from "react";
import { getRegularityRules, getStudentRegularity } from "./services/regularityService";

// Materias con la regularidad perdida del alumno (el logueado, o studentId) y si la institución
// bloquea el final en ese caso. Solo orienta la pantalla: el servidor decide al inscribir
// (REGULARITY_LOST). Si no se puede consultar, no se bloquea nada en pantalla.
export function useLostRegularity(studentId) {
  const [lost, setLost] = useState(new Map());
  const [blocksFinal, setBlocksFinal] = useState(false);

  const reload = useCallback(async () => {
    try {
      const [rules, items] = await Promise.all([getRegularityRules(), getStudentRegularity({ studentId, status: "LOST" })]);
      setBlocksFinal(Boolean(rules.lostBlocksFinal));
      setLost(new Map(items.map((i) => [i.courseId, i])));
    } catch {
      setBlocksFinal(false);
      setLost(new Map());
    }
  }, [studentId]);

  useEffect(() => {
    reload();
  }, [reload]);

  // Item de regularidad perdida de la materia de la mesa si hay que bloquear el final; si no, null.
  const blockedFor = useCallback((courseId) => (blocksFinal ? (lost.get(courseId) ?? null) : null), [blocksFinal, lost]);

  return { blockedFor, reload };
}
