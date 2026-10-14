// Campos que el backend exige al guardar (ProfileRequest::rules). Piso y departamento
// son opcionales. Si cambia esta lista, hay que cambiarla también en el backend.
const REQUIRED_FIELDS = ["phone", "street", "streetNumber", "city", "province", "postalCode"];

export function isProfileComplete(profile) {
  return REQUIRED_FIELDS.every((field) => String(profile?.[field] ?? "").trim() !== "");
}
