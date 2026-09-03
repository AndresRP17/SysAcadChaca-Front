import { LogOut, User, Settings, Menu, Bell, Search, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { UserProfile } from "../../../../shared/ui/userProfile/UserProfile";
import { useState } from 'react';
import './TopBar.css';

const Topbar = ({ onToggle }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [darkMode, setDarkMode] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
        document.documentElement.setAttribute('data-theme', darkMode ? 'light' : 'dark');
    };

    // Obtener el nombre de la página actual
    const currentPath = window.location.pathname;
    const pageName = currentPath.split('/')[1] || 'Dashboard';
    const pageTitle = pageName.charAt(0).toUpperCase() + pageName.slice(1);

    return (
        <header className="topbar">
            <div className="topbar-left">
                <button className="mobile-menu-btn" onClick={onToggle} aria-label="Abrir menú">
                    <Menu size={22} />
                </button>
                <h1 className="topbar-title">{pageTitle}</h1>
            </div>

            <div className="topbar-right">
              

               
               

                {/* Notifications */}
                <button className="topbar-icon-btn topbar-icon-btn--notif" title="Notificaciones">
                    <Bell size={20} />
                    <span className="topbar-badge">3</span>
                </button>

                {/* UserProfile */}
                <UserProfile variant="topbar">
                    <button className="dropdown-item" onClick={() => navigate('/profile')}>
                        <User size={15} />
                        Mi perfil
                    </button>
                    <button className="dropdown-item" onClick={() => navigate('/settings')}>
                        <Settings size={15} />
                        Configuración
                    </button>
                    <div className="dropdown-divider" />
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