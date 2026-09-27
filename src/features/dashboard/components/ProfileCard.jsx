export default function ProfileCard({ profile }) {
  const initials = `${profile.firstName[0] ?? ""}${profile.lastName[0] ?? ""}`;

  return (
    <div className="dash-profile-card">
      <div className="dash-profile-avatar">{initials}</div>
      <div>
        <h2 className="dash-profile-name">
          {profile.firstName} {profile.lastName}
        </h2>
        <p className="dash-profile-detail">Legajo N° {profile.enrollmentNumber}</p>
        <p className="dash-profile-detail">
          {profile.programName} (plan {profile.resolutionYear})
        </p>
        <p className="dash-profile-detail">{profile.email}</p>
      </div>
    </div>
  );
}
