import { NavLink } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import "./DevNav.css";

export default function DevNav() {
  return (
    <nav className="devnav">
      <span className="devnav-label">SysAcad — vista previa:</span>
      <NavLink to="/" end className="devnav-link">
        Login
      </NavLink>
      <NavLink to="/usuarios" className="devnav-link">
        ABM Usuarios
      </NavLink>
      <NavLink to="/alumno" className="devnav-link">
        Vista Alumno
      </NavLink>
      <div className="devnav-spacer" />
      <ThemeToggle />
    </nav>
  );
}
