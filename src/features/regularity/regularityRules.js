// Reglas institucionales de regularidad: pasaje entre lo que manda el servidor (camelCase) y el
// formulario de la tarjeta del calendario académico, y validación de rangos antes de enviar.

export const RETAKE_OPTIONS = [
  { value: "STAFF_WITH_REASON", label: "Solo Bedelía o Administrador, con motivo" },
  { value: "STUDENT_ALLOWED", label: "El propio alumno" },
  { value: "FORBIDDEN", label: "Nadie" },
];

export const MONTHS_RANGE = { min: 1, max: 120 };
export const FAILED_FINALS_RANGE = { min: 1, max: 20 };

// Reglas del servidor -> estado del formulario (todo texto, listo para inputs controlados).
export function rulesToForm(rules) {
  return {
    expires: rules.validMonths !== null && rules.validMonths !== undefined,
    validMonths: rules.validMonths != null ? String(rules.validMonths) : "",
    limited: rules.maxFailedFinals !== null && rules.maxFailedFinals !== undefined,
    maxFailedFinals: rules.maxFailedFinals != null ? String(rules.maxFailedFinals) : "",
    retakePolicy: rules.retakePolicy,
    allowRevalidation: Boolean(rules.allowRevalidation),
    lostBlocksFinal: Boolean(rules.lostBlocksFinal),
    lostBreaksPrerequisites: Boolean(rules.lostBreaksPrerequisites),
  };
}

function parseWhole(text) {
  const value = String(text).trim();
  return /^\d+$/.test(value) ? Number(value) : NaN;
}

// Devuelve { campo: mensaje } con los errores de rango; vacío si todo está bien.
export function validateRulesForm(form) {
  const errors = {};
  if (form.expires) {
    const months = parseWhole(form.validMonths);
    if (!(months >= MONTHS_RANGE.min && months <= MONTHS_RANGE.max)) {
      errors.valid_months = `Indicá una cantidad de meses entre ${MONTHS_RANGE.min} y ${MONTHS_RANGE.max}.`;
    }
  }
  if (form.limited) {
    const finals = parseWhole(form.maxFailedFinals);
    if (!(finals >= FAILED_FINALS_RANGE.min && finals <= FAILED_FINALS_RANGE.max)) {
      errors.max_failed_finals = `Indicá una cantidad de aplazos entre ${FAILED_FINALS_RANGE.min} y ${FAILED_FINALS_RANGE.max}.`;
    }
  }
  return errors;
}

// Formulario -> cuerpo del PUT (snake_case, los seis campos con tipos estrictos).
export function formToPayload(form) {
  return {
    valid_months: form.expires ? parseWhole(form.validMonths) : null,
    max_failed_finals: form.limited ? parseWhole(form.maxFailedFinals) : null,
    retake_policy: form.retakePolicy,
    allow_revalidation: form.allowRevalidation,
    lost_blocks_final: form.lostBlocksFinal,
    lost_breaks_prerequisites: form.lostBreaksPrerequisites,
  };
}

export function sameRulesForm(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}
