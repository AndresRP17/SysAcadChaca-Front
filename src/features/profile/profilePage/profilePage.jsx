import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import LoadError from "../../../shared/ui/LoadError/LoadError";
import { useProfile } from "../hooks/useProfile";
import { changeMyPassword } from "../services/profileService";
import ProfileDataCard from "../components/ProfileDataCard";
import ContactForm from "../components/ContactForm";
import ChangePasswordForm from "../components/ChangePasswordForm";
import "./profilePage.css";

export default function ProfilePage() {
  const { profile, loading, error, reload, save } = useProfile();
  const { showToast } = useToast();
  const { logout } = useAuth();
  const navigate = useNavigate();

  async function handleSave(form) {
    await save(form);
    showToast("Datos actualizados correctamente");
  }

  async function handleChangePassword(data) {
    await changeMyPassword(data);
    // El servidor ya invalidó la sesión: se sale de forma limpia en vez de esperar un 401.
    showToast("Contraseña actualizada. Ingresá de nuevo.");
    logout();
    navigate("/login");
  }

  return (
    <div className="profile-page">
      <header className="profile-header">
        <h1 className="users-title">Mi perfil</h1>
        <p className="users-subtitle">Consultá tus datos y actualizá tu contacto y domicilio.</p>
      </header>

      {loading && !profile && <p className="profile-hint">Cargando...</p>}
      <LoadError message={error} onRetry={reload} />

      {profile && (
        <>
          <ProfileDataCard profile={profile} />
          <ContactForm profile={profile} onSave={handleSave} />
          <ChangePasswordForm onChange={handleChangePassword} />
        </>
      )}
    </div>
  );
}
