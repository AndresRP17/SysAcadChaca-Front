import UserRow from "./UserRow";

export default function UserTable({ users, onEdit, onDelete, studentsOnly = false }) {
  const columnCount = studentsOnly ? 7 : 6;

  return (
    <table className="users-table">
      <thead>
        <tr>
          <th className="users-th">Legajo</th>
          <th className="users-th">Nombre</th>
          {studentsOnly && <th className="users-th">Carrera</th>}
          <th className="users-th">Email</th>
          <th className="users-th">Rol</th>
          <th className="users-th">Estado</th>
          <th className="users-th users-th--actions">Acciones</th>
        </tr>
      </thead>
      <tbody>
        {users.length === 0 ? (
          <tr>
            <td className="users-td users-empty" colSpan={columnCount}>
              No se encontraron usuarios con esos criterios.
            </td>
          </tr>
        ) : (
          users.map((user) => (
            <UserRow key={user.id} user={user} onEdit={onEdit} onDelete={onDelete} showCareer={studentsOnly} />
          ))
        )}
      </tbody>
    </table>
  );
}
