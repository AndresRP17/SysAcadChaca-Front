// Estados de asistencia (mismos valores que el backend) y el porcentaje con credito por estado.

export const STATUSES = [
  { value: "PRESENT", label: "Presente", short: "Presentes" },
  { value: "ABSENT", label: "Ausente", short: "Ausentes" },
  { value: "JUSTIFIED", label: "Justificado", short: "Justificados" },
  { value: "LATE", label: "Tarde", short: "Tardes" },
  { value: "LEFT_EARLY", label: "Se retiró antes", short: "Se retiraron" },
];

export const STATUS_LABELS = Object.fromEntries(STATUSES.map((s) => [s.value, s.label]));

// Lo que ve el Alumno sobre su propia clase.
export const STUDENT_STATUS_LABELS = {
  PRESENT: "Estuviste presente",
  ABSENT: "Estuviste ausente",
  JUSTIFIED: "Ausencia justificada",
  LATE: "Llegaste tarde",
  LEFT_EARLY: "Te retiraste antes",
};

// Etiqueta corta, tono (clase CSS) y marca del chip del calendario del Alumno.
export const STUDENT_BADGES = {
  PRESENT: { text: "Presente ✓", tone: "done", mark: "✓" },
  ABSENT: { text: "Ausente", tone: "absent", mark: "✗" },
  JUSTIFIED: { text: "Justificada", tone: "justified", mark: "J" },
  LATE: { text: "Tarde", tone: "late", mark: "T" },
  LEFT_EARLY: { text: "Se retiró antes", tone: "late", mark: "R" },
};

export const COMMENT_MAX = 255;
export const JUSTIFIED_COMMENT_MIN = 3;

export const DEFAULT_RULES = { lateCredit: 1, leftEarlyCredit: 1 };

// Falta el motivo de una ausencia justificada (minimo 3 caracteres recortados).
export function justifiedCommentMissing(status, comment) {
  return status === "JUSTIFIED" && String(comment ?? "").trim().length < JUSTIFIED_COMMENT_MIN;
}

// Porcentaje = suma de creditos / clases contables * 100. Justificada queda fuera del denominador;
// sin clases contables devuelve null. statuses: lista de estados (strings) de las clases con asistencia.
export function attendanceSummary(statuses, rules = DEFAULT_RULES) {
  const credit = { PRESENT: 1, ABSENT: 0, LATE: rules.lateCredit, LEFT_EARLY: rules.leftEarlyCredit };
  const counted = statuses.filter((s) => s in credit);
  const total = counted.length;
  const sum = counted.reduce((acc, s) => acc + credit[s], 0);
  return {
    total,
    justified: statuses.filter((s) => s === "JUSTIFIED").length,
    credit: sum,
    percentage: total ? Math.round((sum / total) * 100) : null,
  };
}
