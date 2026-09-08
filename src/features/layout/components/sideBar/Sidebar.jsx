import { Link, useLocation } from "react-router-dom";
import { Users, GraduationCap, UserCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "../../../../context/AuthContext";
import { LINKS_BY_ROLE } from "../../roleLinks";
import "./Sidebar.css";

const ALL_LINKS = {
  usuarios: { to: "/usuarios", icon: <Users size={18} />, label: "Usuarios" },
  planes: { to: "/planes", icon: <GraduationCap size={18} />, label: "Planes de estudio" },
  alumno: { to: "/alumno", icon: <UserCircle size={18} />, label: "Vista alumno" },
};

const Sidebar = ({ collapsed, onToggle }) => {
  const location = useLocation();
  const { user } = useAuth();

  const links = (LINKS_BY_ROLE[user?.role] ?? []).map((key) => ALL_LINKS[key]);

  return (
    <>
      <div className={`sidebar-overlay ${!collapsed ? "active" : ""}`} onClick={onToggle} />

      <aside className={`sidebar ${collapsed ? "collapsed" : "open"}`}>
        <div className="sidebar-content">
          <button className="toggle-btn" onClick={onToggle} aria-label="Alternar navegación">
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>

          {!collapsed && (
            <div className="sidebar-brand">
              <span className="sidebar-brand-title">SysAcad</span>
            </div>
          )}

          <nav className="sidebar-nav">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`nav-link ${location.pathname === link.to ? "active" : ""}`}
                onClick={() => {
                  if (window.innerWidth < 768 && !collapsed) onToggle();
                }}
              >
                <span className="nav-icon">{link.icon}</span>
                {!collapsed && <span className="nav-label">{link.label}</span>}
              </Link>
            ))}

            {!collapsed && links.length === 0 && (
              <p className="sidebar-empty">Todavía no hay vistas disponibles para tu rol.</p>
            )}
          </nav>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
