import UserRow from "./UserRow";

export default function UserTable({ users, onEdit, onDelete }) {
  return (
    <table className="users-table">
      <thead>
        <tr>
          <th className="users-th">Legajo</th>
          <th className="users-th">Nombre</th>
          <th className="users-th">Email</th>
          <th className="users-th">Rol</th>
          <th className="users-th">Estado</th>
          <th className="users-th users-th--actions">Acciones</th>
        </tr>
      </thead>
      <tbody>
        {users.length === 0 ? (
          <tr>
            <td className="users-td users-empty" colSpan={6}>
              No se encontraron usuarios con esos criterios.
            </td>
          </tr>
        ) : (
          users.map((user) => (
            <UserRow key={user.id} user={user} onEdit={onEdit} onDelete={onDelete} />
          ))
        )}
      </tbody>
    </table>
  );
}
