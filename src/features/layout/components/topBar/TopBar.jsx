import { LogOut, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../../context/AuthContext";
import { UserProfile } from "../../../../shared/ui/userProfile/UserProfile";
import ThemeToggle from "../../../../shared/ui/ThemeToggle";
import "./TopBar.css";

const PAGE_TITLES = {
  usuarios: "Usuarios",
  planes: "Planes de estudio",
  cursadas: "Cursadas",
  alumno: "Vista alumno",
};

const Topbar = ({ onToggle }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const currentPath = window.location.pathname;
  const pageKey = currentPath.split("/")[1] || "";
  const pageTitle = PAGE_TITLES[pageKey] || "SysAcad";

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="mobile-menu-btn" onClick={onToggle} aria-label="Abrir menú">
          <Menu size={22} />
        </button>
        <h1 className="topbar-title">{pageTitle}</h1>
      </div>

      <div className="topbar-right">
        <ThemeToggle />

        <UserProfile variant="topbar">
          <button className="dropdown-item danger" onClick={handleLogout}>
            <LogOut size={15} />
            Cerrar sesión
          </button>
        </UserProfile>
      </div>
    </header>
  );
};

export default Topbar;
