// Mensaje de error de un campo puntual, a partir del mapa {campo: mensaje}
// que devuelve getFieldErrors(). Uso: <FieldError errors={fieldErrors} field="name" />
export default function FieldError({ errors, field }) {
  if (!errors?.[field]) return null;
  return <p className="users-form-error">{errors[field]}</p>;
}
