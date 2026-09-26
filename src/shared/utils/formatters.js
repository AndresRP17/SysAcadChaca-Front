export function buildParams(params) {
  const qs = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      qs.set(key, value);
    }
  });

  return qs.toString();
}

// El backend manda los datetime como "YYYY-MM-DD HH:MM:SS" (o ISO). Lo pasamos
// a "dd/mm/aaaa HH:MM", que es como se muestra en el resto de la app.
export function formatDateTime(value) {
  if (!value) return "";
  const normalized = String(value).replace(" ", "T");
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return String(value);

  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function isPast(value) {
  if (!value) return false;
  const date = new Date(String(value).replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return false;
  return date.getTime() < Date.now();
}
