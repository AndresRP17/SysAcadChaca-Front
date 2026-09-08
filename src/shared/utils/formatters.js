export function buildParams(params) {
  const qs = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      qs.set(key, value);
    }
  });

  return qs.toString();
}
