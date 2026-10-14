// Datos de identidad: solo lectura. Se cambian desde administración, no desde "Mi perfil".
const ROWS = [
  { label: "Nombre", key: "firstName" },
  { label: "Apellido", key: "lastName" },
  { label: "DNI", key: "nationalId" },
  { label: "Email", key: "email" },
  { label: "Rol", key: "role" },
  { label: "Legajo", key: "fileNumber" },
];

export default function ProfileDataCard({ profile }) {
  return (
    <section className="profile-card" aria-labelledby="profile-data-title">
      <h2 id="profile-data-title" className="profile-card-title">Mis datos</h2>
      <dl className="profile-data">
        {ROWS.map(({ label, key }) => (
          <div key={key} className="profile-data-item">
            <dt className="users-form-label">{label}</dt>
            <dd className="profile-data-value">{profile[key] || "—"}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
