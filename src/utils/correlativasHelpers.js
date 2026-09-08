const STATUS_RANK = { pendiente: 0, regularizada: 1, aprobada: 2 };

function getStatus(statusMap, subjectId) {
  return statusMap.get(subjectId) ?? "pendiente";
}

function meetsRequirement(actualStatus, requiredStatus) {
  return STATUS_RANK[actualStatus] >= STATUS_RANK[requiredStatus];
}

// Devuelve, para una materia y un tipo ("cursar" | "rendir"), si está
// habilitada y la lista de correlativas que le faltan (con su ordenanza),
// tal como lo muestra la pantalla real de SysAcad.
export function getCorrelatividadInfo(subject, type, { subjects, prerequisites, studentSubjectStatus }) {
  const statusMap = new Map(studentSubjectStatus.map((s) => [s.subjectId, s.status]));
  const subjectById = new Map(subjects.map((s) => [s.id, s]));

  const rules = prerequisites.filter((p) => p.subjectId === subject.id && p.type === type);

  const missing = rules
    .filter((rule) => !meetsRequirement(getStatus(statusMap, rule.requiresSubjectId), rule.requiredStatus))
    .map((rule) => ({
      subjectName: subjectById.get(rule.requiresSubjectId)?.name ?? "Materia desconocida",
      ordinance: rule.ordinance,
    }));

  return {
    habilitada: missing.length === 0,
    missing,
  };
}
