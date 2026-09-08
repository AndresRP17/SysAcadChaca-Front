export default function ProfileCard({ perfil }) {
  const iniciales = `${perfil.nombre[0]}${perfil.apellido[0]}`;

  return (
    <div className="dash-profile-card">
      <div className="dash-profile-avatar">{iniciales}</div>
      <div>
        <h2 className="dash-profile-name">
          {perfil.nombre} {perfil.apellido}
        </h2>
        <p className="dash-profile-detail">Legajo N° {perfil.legajo}</p>
        <p className="dash-profile-detail">{perfil.carrera}</p>
        <p className="dash-profile-detail">{perfil.email}</p>
      </div>
    </div>
  );
}
