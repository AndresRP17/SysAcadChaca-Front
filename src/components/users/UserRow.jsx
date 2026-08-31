export default function UserRow({ user, onEdit, onDelete }) {
  return (
    <tr className="users-row">
      <td className="users-td users-td--mono" data-label="Legajo">{user.legajo}</td>
      <td className="users-td" data-label="Nombre">
        {user.nombre} {user.apellido}
      </td>
      <td className="users-td" data-label="Email">{user.email}</td>
      <td className="users-td" data-label="Rol">
        <span
          className={
            "users-badge " +
            (user.rol === "Docente" ? "users-badge--navy" : "users-badge--gray")
          }
        >
          {user.rol}
        </span>
      </td>
      <td className="users-td" data-label="Estado">
        <span
          className={
            "users-badge " +
            (user.estado === "Activo" ? "users-badge--active" : "users-badge--inactive")
          }
        >
          {user.estado}
        </span>
      </td>
      <td className="users-td users-td--actions" data-label="Acciones">
        <button
          type="button"
          className="users-action-btn"
          style={{ marginRight: "12px" }}
          onClick={() => onEdit(user)}
        >
          Editar
        </button>
        <button
          type="button"
          className="users-action-btn users-action-btn--danger"
          onClick={() => onDelete(user)}
        >
          Eliminar
        </button>
      </td>
    </tr>
  );
}