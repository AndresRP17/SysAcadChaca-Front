import test from "node:test";
import assert from "node:assert/strict";
import { cleanParams, toPage } from "./pagedList.js";

test("toPage toma el total del header X-Total-Count", () => {
  const page = toPage({ data: [{ id: 1 }, { id: 2 }], headers: { "x-total-count": "27" } });
  assert.deepEqual(page, { items: [{ id: 1 }, { id: 2 }], total: 27 });
});

test("toPage cae a la cantidad de items si no hay header", () => {
  assert.deepEqual(toPage({ data: [{ id: 1 }], headers: {} }), { items: [{ id: 1 }], total: 1 });
  assert.deepEqual(toPage({ data: null, headers: {} }), { items: [], total: 0 });
});

test("cleanParams descarta valores vacíos y conserva el 0", () => {
  assert.deepEqual(cleanParams({ q: "", page: 1, active: 0, role_id: null, x: undefined }), { page: 1, active: 0 });
});
