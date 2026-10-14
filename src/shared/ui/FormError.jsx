// Error de un formulario o acción: va pegado al botón de guardar (no arriba de la página),
// para que se vea justo donde se tocó. Se anuncia a lectores de pantalla.
export default function FormError({ message }) {
  if (!message) return null;
  return (
    <p className="users-form-error form-error" role="alert">
      {message}
    </p>
  );
}
