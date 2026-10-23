import { LogOut, Menu, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../../context/AuthContext";
import { UserProfile } from "../../../../shared/ui/userProfile/UserProfile";
import ThemeToggle from "../../../../shared/ui/ThemeToggle";
import "./TopBar.css";

import { pageTitleFor } from "../../pageTitles";

const Topbar = ({ onToggle }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const { pathname } = useLocation();
  const pageTitle = pageTitleFor(pathname);

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button type="button" className="mobile-menu-btn" onClick={onToggle} aria-label="Abrir menú">
          <Menu size={22} />
        </button>
        <h1 className="topbar-title">{pageTitle}</h1>
      </div>

      <div className="topbar-right">
        <ThemeToggle />

        <UserProfile variant="topbar">
          <button type="button" className="dropdown-item" onClick={() => navigate("/perfil")}>
            <User size={15} />
            Mi perfil
          </button>
          <button type="button" className="dropdown-item danger" onClick={handleLogout}>
            <LogOut size={15} />
            Cerrar sesión
          </button>
        </UserProfile>
      </div>
    </header>
  );
};

export default Topbar;
