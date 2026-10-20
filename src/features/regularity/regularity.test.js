import test from "node:test";
import assert from "node:assert/strict";
import { formToPayload, rulesToForm, validateRulesForm } from "./regularityRules.js";
import {
  formatRegularityDate,
  lostCourseIds,
  lostReasonText,
  remainingFinalsText,
  staffRegularityLines,
  studentRegularityLines,
} from "./regularityStatus.js";

const DEFAULTS = {
  validMonths: null,
  maxFailedFinals: 4,
  retakePolicy: "STAFF_WITH_REASON",
  allowRevalidation: true,
  lostBlocksFinal: true,
  lostBreaksPrerequisites: true,
};

test("las reglas por defecto no vencen por tiempo y limitan a 4 aplazos", () => {
  const form = rulesToForm(DEFAULTS);
  assert.equal(form.expires, false);
  assert.equal(form.limited, true);
  assert.equal(form.maxFailedFinals, "4");
  assert.deepEqual(validateRulesForm(form), {});
});

test("el cuerpo del PUT lleva los seis campos con tipos estrictos", () => {
  const payload = formToPayload(rulesToForm(DEFAULTS));
  assert.deepEqual(payload, {
    valid_months: null,
    max_failed_finals: 4,
    retake_policy: "STAFF_WITH_REASON",
    allow_revalidation: true,
    lost_blocks_final: true,
    lost_breaks_prerequisites: true,
  });
  const withMonths = formToPayload({ ...rulesToForm(DEFAULTS), expires: true, validMonths: "18", limited: false });
  assert.equal(withMonths.valid_months, 18);
  assert.equal(withMonths.max_failed_finals, null);
});

test("valida los rangos de meses y aplazos", () => {
  const base = rulesToForm(DEFAULTS);
  assert.ok(validateRulesForm({ ...base, expires: true, validMonths: "0" }).valid_months);
  assert.ok(validateRulesForm({ ...base, expires: true, validMonths: "121" }).valid_months);
  assert.ok(validateRulesForm({ ...base, expires: true, validMonths: "2,5" }).valid_months);
  assert.ok(validateRulesForm({ ...base, expires: true, validMonths: "" }).valid_months);
  assert.deepEqual(validateRulesForm({ ...base, expires: true, validMonths: "120" }), {});
  assert.ok(validateRulesForm({ ...base, maxFailedFinals: "21" }).max_failed_finals);
  assert.ok(validateRulesForm({ ...base, maxFailedFinals: "0" }).max_failed_finals);
  assert.deepEqual(validateRulesForm({ ...base, limited: false, maxFailedFinals: "" }), {});
});

test("formatea las fechas de regularidad como dd/mm/aaaa", () => {
  assert.equal(formatRegularityDate("2027-03-01 10:00:00"), "01/03/2027");
  assert.equal(formatRegularityDate(null), "");
});

test("explica por qué se perdió la regularidad", () => {
  assert.equal(lostReasonText({ lostReason: "TIME" }), "por vencimiento del plazo");
  assert.equal(lostReasonText({ lostReason: "FAILED_FINALS", failedFinals: 4 }), "por acumular 4 finales desaprobados");
  assert.equal(lostReasonText({ lostReason: "FAILED_FINALS", failedFinals: 1 }), "por acumular 1 final desaprobado");
});

test("cuenta los aplazos que quedan", () => {
  assert.equal(remainingFinalsText({ remainingFinals: null }), "");
  assert.equal(remainingFinalsText({ remainingFinals: 2 }), "te quedan 2 aplazos");
  assert.equal(remainingFinalsText({ remainingFinals: 1 }), "te queda 1 aplazo");
  assert.equal(remainingFinalsText({ remainingFinals: 0 }), "no te quedan aplazos");
});

test("líneas de detalle del alumno y de bedelía", () => {
  const regular = { status: "REGULAR", expiresAt: "2027-03-01 10:00:00", remainingFinals: 2, failedFinals: 2, regularizedAt: "2026-09-01 10:00:00" };
  assert.deepEqual(studentRegularityLines(regular), ["vence el 01/03/2027", "te quedan 2 aplazos"]);
  assert.deepEqual(staffRegularityLines(regular), ["Regularizada el 01/09/2026", "2 aplazos", "vence el 01/03/2027", "restan 2 aplazos"]);
  const lost = {
    status: "LOST",
    lostReason: "FAILED_FINALS",
    failedFinals: 4,
    lastRevalidation: { at: "2026-10-01 09:00:00", reason: "Error de carga", byName: "Perez, Juan" },
  };
  const lines = studentRegularityLines(lost);
  assert.equal(lines[0], "Perdida por acumular 4 finales desaprobados");
  assert.match(lines[1], /Revalidada el 01\/10\/2026 por Perez, Juan: Error de carga/);
});

test("junta las materias con regularidad perdida", () => {
  const ids = lostCourseIds([
    { courseId: 1, status: "LOST" },
    { courseId: 2, status: "REGULAR" },
  ]);
  assert.deepEqual([...ids], [1]);
});
