// Cache de GET para el cliente de la API.
//
// Las pantallas del portal piden varias veces lo mismo al abrirse (el alumno, sus inscripciones...)
// y en el servidor cada pedido cuesta una conexión nueva a la base. Con esto:
//   - los GET iguales que están en vuelo comparten una sola respuesta;
//   - la respuesta se reusa unos segundos (más tiempo para catálogos que casi no cambian);
//   - cualquier POST/PUT/PATCH/DELETE vacía todo el cache, para no mostrar datos viejos.
// La clave incluye el token: un usuario nunca recibe lo que pidió otro en la misma pestaña.
// Es una solución transitoria; la definitiva es no pedir de más (filtros en el servidor).

export const DEFAULT_TTL_MS = 15000;
export const CATALOG_TTL_MS = 120000;

const CATALOG_PATHS = [
  "/programs", "/study-plans", "/courses", "/curriculum-courses", "/buildings", "/classrooms",
  "/roles", "/academic-terms", "/academic-thresholds", "/non-teaching-days",
];

const WRITE_METHODS = ["post", "put", "patch", "delete"];

function ttlFor(url) {
  const path = String(url).split("?")[0];
  return CATALOG_PATHS.includes(path) ? CATALOG_TTL_MS : DEFAULT_TTL_MS;
}

// Reemplaza get/post/put/patch/delete de `client` (una instancia de axios) por versiones con cache.
// Devuelve { clear } para vaciarlo a mano. `now` se inyecta para poder probarlo.
export function installRequestCache(client, { getToken, now = Date.now }) {
  const cache = new Map();
  const rawGet = client.get.bind(client);

  const clear = () => cache.clear();

  client.get = (url, config) => {
    // Pedidos cancelables o con formato especial (descargas) no se comparten.
    if (config?.signal || config?.responseType) return rawGet(url, config);

    const key = JSON.stringify([getToken(), url, config?.params ?? null]);
    const hit = cache.get(key);
    if (hit && now() - hit.at < ttlFor(url)) return hit.promise;

    const promise = rawGet(url, config);
    const entry = { promise, at: now() };
    cache.set(key, entry);
    // Un pedido fallido no se guarda: el reintento tiene que volver a salir.
    promise.catch(() => {
      if (cache.get(key) === entry) cache.delete(key);
    });
    return promise;
  };

  for (const method of WRITE_METHODS) {
    const raw = client[method].bind(client);
    client[method] = (...args) => {
      // Se vacía antes y después: un GET en vuelo no debe repoblar el cache con datos previos a la escritura.
      clear();
      return raw(...args).finally(clear);
    };
  }

  return { clear };
}
