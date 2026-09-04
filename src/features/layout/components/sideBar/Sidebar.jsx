import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';
import './Sidebar.css';

import {
    LayoutDashboard,

    Users,
    UserCircle,
    BookOpen,
    School,
    FileText,
    GraduationCap,
    Settings,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';

const Sidebar = ({ collapsed, onToggle }) => {
    const location = useLocation();
    

   

    // Enlaces principales
    const mainLinks = [
        { to: "/dashboard", icon: <LayoutDashboard size={18} />, label: "Dashboard" },
        { to: "/users", icon: <Users size={18} />, label: "Usuarios" },
        { to: "/students", icon: <Users size={18} />, label: "Alumnos" },
        { to: "/teachers", icon: <UserCircle size={18} />, label: "Docentes" },
        { to: "/subjects", icon: <BookOpen size={18} />, label: "Materias" },
        { to: "/classrooms", icon: <School size={18} />, label: "Aulas" },
        { to: "/grades", icon: <FileText size={18} />, label: "Notas" },
        { to: "/careers", icon: <GraduationCap size={18} />, label: "Carreras" },
    ];

    // Enlaces de configuración
    const configLinks = [
        { to: "/settings", icon: <Settings size={18} />, label: "Configuración" },
    ];

    return (
        <>
            {/* Fondo oscuro para móvil cuando el sidebar está abierto */}
            <div 
                className={`sidebar-overlay ${!collapsed ? 'active' : ''}`} 
                onClick={onToggle}
            />

            <aside className={`sidebar ${collapsed ? 'collapsed' : 'open'}`}>
                <div className="sidebar-content">
                    {/* Botón de alternancia / cierre */}
                    <button className="toggle-btn" onClick={onToggle} aria-label="Toggle Navigation">
                        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                    </button>

                    {/* Logo */}
                    {!collapsed && (
                        <div className="sidebar-brand">
                            <span className="sidebar-brand-title">SGA</span>
                        </div>
                    )}

                    {!collapsed && <div className="nav-section-title">Principal</div>}
                    <nav className="sidebar-nav">
                        {mainLinks.map((link) => (
                            <Link
                                key={link.to}
                                to={link.to}
                                className={`nav-link ${location.pathname === link.to ? 'active' : ''}`}
                                onClick={() => {
                                    if (window.innerWidth < 768 && !collapsed) {
                                        onToggle();
                                    }
                                }}
                            >
                                <span className="nav-icon">{link.icon}</span>
                                {!collapsed && <span className="nav-label">{link.label}</span>}
                            </Link>
                        ))}
                    </nav>

                    {configLinks.length > 0 && (
                        <>
                            {!collapsed && <div className="nav-section-title">Configuración</div>}
                            <nav className="sidebar-nav">
                                {configLinks.map((link) => (
                                    <Link
                                        key={link.to}
                                        to={link.to}
                                        className={`nav-link ${location.pathname === link.to ? 'active' : ''}`}
                                        onClick={() => {
                                            if (window.innerWidth < 768 && !collapsed) {
                                                onToggle();
                                            }
                                        }}
                                    >
                                        <span className="nav-icon">{link.icon}</span>
                                        {!collapsed && <span className="nav-label">{link.label}</span>}
                                    </Link>
                                ))}
                            </nav>
                        </>
                    )}

                   
                    
                </div>
            </aside>
        </>
    );
};

export default Sidebar;