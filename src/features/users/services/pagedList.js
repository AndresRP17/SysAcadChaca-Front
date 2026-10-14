// Las listas del servidor devuelven el array en el body y el total (sin paginar) en X-Total-Count.
export function toPage(response) {
  const items = Array.isArray(response.data) ? response.data : [];
  const total = Number(response.headers?.["x-total-count"]);
  return { items, total: Number.isFinite(total) ? total : items.length };
}

// Arma el objeto params de axios sin las claves vacías.
export function cleanParams(params) {
  return Object.fromEntries(Object.entries(params).filter(([, v]) => v !== "" && v !== null && v !== undefined));
}
