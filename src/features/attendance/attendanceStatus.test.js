import test from "node:test";
import assert from "node:assert/strict";
import { attendanceSummary, justifiedCommentMissing } from "./attendanceStatus.js";

test("con reglas por defecto tarde y retiro anticipado cuentan como presente", () => {
  const r = attendanceSummary(["PRESENT", "LATE", "LEFT_EARLY", "ABSENT"]);
  assert.equal(r.total, 4);
  assert.equal(r.percentage, 75);
});

test("media falta para tarde baja el porcentaje", () => {
  const r = attendanceSummary(["PRESENT", "LATE", "PRESENT", "PRESENT"], { lateCredit: 0.5, leftEarlyCredit: 1 });
  assert.equal(r.percentage, 88); // 3.5 / 4
});

test("la ausencia justificada sale del denominador", () => {
  const r = attendanceSummary(["PRESENT", "JUSTIFIED", "JUSTIFIED", "ABSENT"]);
  assert.equal(r.total, 2);
  assert.equal(r.justified, 2);
  assert.equal(r.percentage, 50);
});

test("sin clases contables no hay porcentaje", () => {
  assert.equal(attendanceSummary(["JUSTIFIED"]).percentage, null);
  assert.equal(attendanceSummary([]).percentage, null);
});

test("justificado exige motivo de al menos 3 caracteres recortados", () => {
  assert.equal(justifiedCommentMissing("JUSTIFIED", "  a "), true);
  assert.equal(justifiedCommentMissing("JUSTIFIED", "Certificado"), false);
  assert.equal(justifiedCommentMissing("LATE", ""), false);
});
