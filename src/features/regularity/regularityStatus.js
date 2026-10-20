// Textos de la regularidad de una materia (lo que devuelve /students/{id}/regularity y el historial).

export const REGULARITY_LABELS = {
  REGULAR: "Regular",
  LOST: "Perdida",
  APPROVED: "Aprobada",
};

// Variante de color de .users-badge para cada estado.
export const REGULARITY_BADGE = {
  REGULAR: "navy",
  LOST: "inactive",
  APPROVED: "active",
};

export function regularityLabel(status) {
  return REGULARITY_LABELS[status] ?? status;
}

// "2027-03-01 10:00:00" o "2027-03-01" -> "01/03/2027". Vacío si no hay fecha.
export function formatRegularityDate(value) {
  if (!value) return "";
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value));
  return match ? `${match[3]}/${match[2]}/${match[1]}` : String(value);
}

function plural(count, one, many) {
  return `${count} ${count === 1 ? one : many}`;
}

// Motivo de la pérdida: "por vencimiento del plazo" / "por acumular 4 finales desaprobados".
export function lostReasonText(item) {
  if (item.lostReason === "TIME") return "por vencimiento del plazo";
  if (item.lostReason === "FAILED_FINALS") {
    return `por acumular ${plural(item.failedFinals, "final desaprobado", "finales desaprobados")}`;
  }
  return "";
}

// Cuántos aplazos quedan antes de perderla (solo si la institución fijó un límite).
export function remainingFinalsText(item) {
  if (item.remainingFinals === null || item.remainingFinals === undefined) return "";
  if (item.remainingFinals === 0) return "no te quedan aplazos";
  return `${item.remainingFinals === 1 ? "te queda" : "te quedan"} ${plural(item.remainingFinals, "aplazo", "aplazos")}`;
}

// Líneas de detalle para el alumno (en segunda persona), según el estado.
export function studentRegularityLines(item) {
  const lines = [];
  if (item.status === "REGULAR") {
    if (item.expiresAt) lines.push(`vence el ${formatRegularityDate(item.expiresAt)}`);
    const remaining = remainingFinalsText(item);
    if (remaining) lines.push(remaining);
  }
  if (item.status === "LOST") {
    const reason = lostReasonText(item);
    if (reason) lines.push(`Perdida ${reason}`);
  }
  if (item.lastRevalidation) {
    const { at, reason, byName } = item.lastRevalidation;
    lines.push(`Revalidada el ${formatRegularityDate(at)}${byName ? ` por ${byName}` : ""}: ${reason}`);
  }
  return lines;
}

// Líneas de detalle para Bedelía (en tercera persona).
export function staffRegularityLines(item) {
  const lines = [];
  if (item.regularizedAt) lines.push(`Regularizada el ${formatRegularityDate(item.regularizedAt)}`);
  lines.push(plural(item.failedFinals, "aplazo", "aplazos"));
  if (item.status === "REGULAR") {
    if (item.expiresAt) lines.push(`vence el ${formatRegularityDate(item.expiresAt)}`);
    if (item.remainingFinals !== null && item.remainingFinals !== undefined) {
      lines.push(`restan ${plural(item.remainingFinals, "aplazo", "aplazos")}`);
    }
  }
  if (item.status === "LOST") {
    const reason = lostReasonText(item);
    if (reason) lines.push(`perdida ${reason}`);
  }
  if (item.lastRevalidation) {
    const { at, reason, byName } = item.lastRevalidation;
    lines.push(`Revalidada el ${formatRegularityDate(at)}${byName ? ` por ${byName}` : ""}: ${reason}`);
  }
  return lines;
}

// Mapa courseId -> item de las materias con regularidad perdida (para marcar mesas).
export function lostCourseIds(items) {
  return new Set(items.filter((i) => i.status === "LOST").map((i) => i.courseId));
}
