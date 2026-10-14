import UserRow from "./UserRow";

export default function UserTable({ users, onEdit, onDelete, studentsOnly = false }) {
  return (
    <table className="users-table">
      <thead>
        <tr>
          {studentsOnly ? (
            <>
              <th className="users-th">Legajo</th>
              <th className="users-th">Nombre</th>
              <th className="users-th">Carrera</th>
              <th className="users-th">Email</th>
            </>
          ) : (
            <>
              <th className="users-th">Nombre</th>
              <th className="users-th">Email</th>
              <th className="users-th">DNI</th>
              <th className="users-th">Rol</th>
            </>
          )}
          <th className="users-th">Estado</th>
          <th className="users-th users-th--actions">Acciones</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <UserRow key={user.id} user={user} onEdit={onEdit} onDelete={onDelete} studentsOnly={studentsOnly} />
        ))}
      </tbody>
    </table>
  );
}
