import test from "node:test";
import assert from "node:assert/strict";
import { suggestSectionName } from "./sectionNames.js";

const section = (name, over = {}) => ({ curriculumCourseId: 5, academicYear: 2026, term: 1, name, ...over });

test("sin comisiones sugiere la A", () => {
  assert.equal(suggestSectionName([], 5, 2026, 1), "A");
});

test("sugiere la primera letra libre, aunque haya huecos", () => {
  assert.equal(suggestSectionName([section("A"), section("C")], 5, 2026, 1), "B");
});

test("reconoce nombres como 'Comisión B' y mayúsculas o minúsculas", () => {
  assert.equal(suggestSectionName([section("A"), section("Comisión B"), section("c")], 5, 2026, 1), "D");
});

test("solo cuentan las comisiones de la misma materia, año y período", () => {
  const others = [section("A", { curriculumCourseId: 9 }), section("A", { academicYear: 2025 }), section("A", { term: 2 })];
  assert.equal(suggestSectionName(others, 5, 2026, 1), "A");
});

test("acepta ids y años como texto (vienen del formulario)", () => {
  assert.equal(suggestSectionName([section("A")], "5", "2026", "1"), "B");
});

test("una materia anual (período 0) se cuenta aparte", () => {
  assert.equal(suggestSectionName([section("A", { term: 0 })], 5, 2026, 0), "B");
  assert.equal(suggestSectionName([section("A", { term: 0 })], 5, 2026, 1), "A");
});
