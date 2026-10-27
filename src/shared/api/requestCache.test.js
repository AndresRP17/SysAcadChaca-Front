// Se corre con: npm test   (usa el test runner de Node, sin dependencias extra)
import test from "node:test";
import assert from "node:assert/strict";
import { installRequestCache, DEFAULT_TTL_MS, CATALOG_TTL_MS } from "./requestCache.js";

function fakeClient() {
  const calls = [];
  const client = {
    get: async (url) => { calls.push(["get", url]); return { data: url }; },
    post: async (url) => { calls.push(["post", url]); return { data: "ok" }; },
    put: async (url) => { calls.push(["put", url]); return { data: "ok" }; },
    patch: async (url) => { calls.push(["patch", url]); return { data: "ok" }; },
    delete: async (url) => { calls.push(["delete", url]); return { data: "ok" }; },
  };
  return { client, calls };
}

function setup(token = "t1") {
  const { client, calls } = fakeClient();
  const clock = { t: 0 };
  const state = { token };
  const cache = installRequestCache(client, { getToken: () => state.token, now: () => clock.t });
  return { client, calls, clock, state, cache };
}

test("GET iguales en paralelo hacen un solo pedido", async () => {
  const { client, calls } = setup();
  await Promise.all([client.get("/sections"), client.get("/sections"), client.get("/sections")]);
  assert.equal(calls.length, 1);
});

test("reusa la respuesta dentro del tiempo y vuelve a pedir al vencer", async () => {
  const { client, calls, clock } = setup();
  await client.get("/sections");
  clock.t = DEFAULT_TTL_MS - 1;
  await client.get("/sections");
  assert.equal(calls.length, 1);
  clock.t = DEFAULT_TTL_MS + 1;
  await client.get("/sections");
  assert.equal(calls.length, 2);
});

test("los catálogos duran más que el resto", async () => {
  const { client, calls, clock } = setup();
  await client.get("/programs?size=1000");
  clock.t = CATALOG_TTL_MS - 1;
  await client.get("/programs?size=1000");
  assert.equal(calls.length, 1);
  clock.t = CATALOG_TTL_MS + 1;
  await client.get("/programs?size=1000");
  assert.equal(calls.length, 2);
});

test("URLs distintas no se comparten", async () => {
  const { client, calls } = setup();
  await client.get("/sections?size=7");
  await client.get("/sections?size=8");
  assert.equal(calls.length, 2);
});

for (const method of ["post", "put", "patch", "delete"]) {
  test(`${method.toUpperCase()} vacía el cache`, async () => {
    const { client, calls } = setup();
    await client.get("/enrollments");
    await client[method]("/enrollments", {});
    await client.get("/enrollments");
    assert.equal(calls.filter(([m]) => m === "get").length, 2);
  });
}

test("un GET en vuelo durante una escritura no deja datos viejos", async () => {
  const { client, calls } = setup();
  const lento = client.get("/enrollments");
  await client.post("/enrollments", {});
  await lento;
  await client.get("/enrollments");
  assert.equal(calls.filter(([m]) => m === "get").length, 2);
});

test("un usuario no recibe lo que pidió otro", async () => {
  const { client, calls, state } = setup("alumno");
  await client.get("/students/me");
  state.token = "otro";
  await client.get("/students/me");
  assert.equal(calls.length, 2);
});

test("un pedido fallido no se guarda", async () => {
  const calls = [];
  let fallar = true;
  const client = {
    get: async (url) => { calls.push(url); if (fallar) throw new Error("boom"); return { data: url }; },
    post: async () => ({}), put: async () => ({}), patch: async () => ({}), delete: async () => ({}),
  };
  installRequestCache(client, { getToken: () => "t", now: () => 0 });
  await assert.rejects(client.get("/sections"));
  fallar = false;
  await client.get("/sections");
  assert.equal(calls.length, 2);
});

test("pedidos cancelables no se comparten", async () => {
  const { client, calls } = setup();
  const signal = new AbortController().signal;
  await client.get("/sections", { signal });
  await client.get("/sections", { signal });
  assert.equal(calls.length, 2);
});

test("una escritura idéntica en vuelo comparte un solo pedido (doble click en Guardar)", async () => {
  const { client, calls } = setup();
  const body = { name: "Comisión A" };
  const [a, b] = await Promise.all([client.post("/sections", body), client.post("/sections", { ...body })]);
  assert.equal(calls.filter(([method]) => method === "post").length, 1);
  assert.equal(a, b);
});

test("escrituras distintas en paralelo salen las dos", async () => {
  const { client, calls } = setup();
  await Promise.all([client.post("/sections", { name: "A" }), client.post("/sections", { name: "B" }), client.delete("/sections/1")]);
  assert.equal(calls.length, 3);
});

test("terminada la escritura, repetirla vuelve a enviarla", async () => {
  const { client, calls } = setup();
  await client.post("/sections", { name: "A" });
  await client.post("/sections", { name: "A" });
  assert.equal(calls.length, 2);
});

test("una escritura fallida no deja bloqueado el reintento", async () => {
  const { client, calls } = setup();
  let fail = true;
  const original = client.post;
  client.post = async (url) => { calls.push(["post", url]); if (fail) throw new Error("409"); return { data: "ok" }; };
  installRequestCache(client, { getToken: () => "t1", now: () => 0 });
  await assert.rejects(client.post("/sections", { name: "A" }));
  fail = false;
  await client.post("/sections", { name: "A" });
  assert.equal(calls.length, 2);
  client.post = original;
});
