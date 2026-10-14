import { api } from "../../../shared/api/api";

// El backend responde en camelCase pero espera snake_case al guardar (igual que el resto de la API).
export async function getMyProfile() {
  const { data } = await api.get("/users/me");
  return data;
}

// Solo teléfono y domicilio: email e identidad no se editan desde acá. El PUT reemplaza el
// domicilio completo, así que siempre se mandan todos los campos.
export async function updateMyProfile(form) {
  const { data } = await api.put("/users/me", {
    phone: form.phone,
    street: form.street,
    street_number: form.streetNumber,
    floor: form.floor,
    apartment: form.apartment,
    city: form.city,
    province: form.province,
    postal_code: form.postalCode,
  });
  return data;
}

// Responde 204. Después de cambiarla el servidor invalida la sesión actual.
export async function changeMyPassword({ currentPassword, newPassword }) {
  await api.put("/users/me/password", {
    current_password: currentPassword,
    new_password: newPassword,
  });
}
