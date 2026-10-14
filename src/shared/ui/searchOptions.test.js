import test from "node:test";
import assert from "node:assert/strict";
import { createLatestGuard, studentOption, teacherOption } from "./searchOptions.js";

test("studentOption arma Apellido, Nombre - legajo - DNI - carrera", () => {
  const o = studentOption({ id: 7, lastName: "Gomez", firstName: "Ana", enrollmentNumber: "L-1001", nationalId: "333", programName: "TUP" });
  assert.equal(o.value, 7);
  assert.equal(o.label, "Gomez, Ana — legajo L-1001 (DNI 333) · TUP");
  assert.equal(o.data.id, 7);
});

test("studentOption sin carrera no deja un separador colgando", () => {
  const o = studentOption({ id: 1, lastName: "A", firstName: "B", enrollmentNumber: "L-1", nationalId: "2" });
  assert.equal(o.label, "A, B — legajo L-1 (DNI 2)");
});

test("teacherOption muestra apellido, nombre y legajo", () => {
  assert.equal(teacherOption({ id: 3, lastName: "Perez", firstName: "Juan", employeeNumber: "E-100" }).label, "Perez, Juan — legajo E-100");
});

test("createLatestGuard solo acepta el ultimo pedido", () => {
  const guard = createLatestGuard();
  const a = guard.next();
  const b = guard.next();
  assert.equal(guard.isLatest(a), false);
  assert.equal(guard.isLatest(b), true);
  guard.invalidate();
  assert.equal(guard.isLatest(b), false);
});
