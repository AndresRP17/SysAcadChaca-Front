import { api } from "../../../shared/api/api";

// Devuelve { items, total, page, size }. A diferencia del resto de las listas de la API,
// esta trae el total para poder paginar en el servidor.
export async function getAuditLogs({ page = 1, size = 10, action, from, to } = {}) {
  const params = { page, size };
  if (action) params.action = action;
  if (from) params.from = from;
  if (to) params.to = to;

  const { data } = await api.get("/audit-logs", { params });
  return data;
}
