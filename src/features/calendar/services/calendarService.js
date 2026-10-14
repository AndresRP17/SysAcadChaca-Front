import { api } from "../../../shared/api/api";

// Clases del calendario entre dos fechas (YYYY-MM-DD), ya filtradas por el rol del
// usuario en el backend. Devuelve { events, missingTerms }.
export async function getCalendar(from, to) {
  const { data } = await api.get(`/calendar?from=${from}&to=${to}`);
  return data;
}
