import { useState } from "react";
<<<<<<< HEAD
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Sun, Moon } from "lucide-react";
import { SiInstagram, SiFacebook, SiX, SiYoutube } from "@icons-pack/react-simple-icons";
import { useAuth } from "../../../../../context/AuthContext";
import { useTheme } from "../../../../../context/ThemeContext";
import { getDefaultRouteForRole } from "../../../../layout/roleLinks";
import utnLogo from "./utn-logo.jpg";
import "./login.css";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
=======
import ThemeToggle from "../themeToggle/ThemeToggle";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import utnLogo from "./utn-logo.jpg";
import "./login.css";
import { useAuth } from '../../../../../context/AuthContext';

import { useNavigate } from 'react-router-dom';

export default function Login() {
>>>>>>> origin/develop
  const [legajo, setLegajo] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [focused, setFocused] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

<<<<<<< HEAD
=======

  const navigate = useNavigate();
  const { login } = useAuth();


>>>>>>> origin/develop
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validación de campos vacíos
    if (!legajo.trim() || !password.trim()) {
      setError("Completá email y contraseña para continuar.");
      return;
    }
<<<<<<< HEAD
    setError("");
    setLoading(true);
    try {
      // El campo se sigue llamando "legajo" en la UI (así lo diseñaron), pero
      // el backend real solo tiene login por email todavía — se manda como email.
      const { user } = await login(legajo.trim(), password);
      navigate(getDefaultRouteForRole(user?.role));
    } catch (err) {
      setError(err.message);
=======

    setLoading(true);

    try {
      // Acá va la lógica de autenticación con el service
      // Asumiendo que el login espera email y password, 
      // y que el legajo funciona como email o username
      await login(legajo, password);
      console.log('Login exitoso');
      navigate('/appointments'); // o la ruta que corresponda
    } catch (err) {
      console.error('Error al iniciar sesión:', err);
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.title ||
        err.response?.data?.error ||
        err.message ||
        'Error al iniciar sesión. Verificá tus credenciales.';

      setError(errorMessage);
>>>>>>> origin/develop
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sysacad-page">
      <div className="sysacad-theme-toggle-wrapper">
        <ThemeToggle />
      </div>



      <div className="sysacad-wrapper">
        {/* Panel institucional */}
        <div className="sysacad-panel">
          <div className="sysacad-panel-texture" />
          <div className="sysacad-panel-top">
            <img src={utnLogo} alt="UTN San Nicolás - Aula Chacabuco" className="sysacad-panel-logo" />
            <h1 className="sysacad-wordmark">SysAcad</h1>
            <p className="sysacad-panel-text">
              Tu gestión académica, en un solo lugar: notas, inscripciones y
              trámites de la facultad.
            </p>
          </div>

          <div className="sysacad-panel-bottom">
            <p className="sysacad-panel-note">
              Acceso exclusivo para alumnos y personal del Aula Chacabuco —
              UTN Facultad Regional San Nicolás.
            </p>
          </div>
        </div>

        {/* Panel de login */}
        <div className="sysacad-form-side">
          <div className="sysacad-form-box">
<<<<<<< HEAD
            <button
              type="button"
              onClick={toggleDarkMode}
              aria-label={darkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
              className="sysacad-theme-toggle"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
=======
>>>>>>> origin/develop

            <div className="sysacad-mobile-header">
              <img src={utnLogo} alt="UTN San Nicolás - Aula Chacabuco" className="sysacad-mobile-logo" />
              <div>
                <h1 className="sysacad-wordmark-sm">SysAcad</h1>
                <p className="sysacad-eyebrow-sm">Aula Chacabuco</p>
              </div>
            </div>

            <h2 className="sysacad-title">Bienvenido de nuevo</h2>
            <p className="sysacad-subtitle">Ingresá con tu legajo para continuar.</p>

            {/* Mensaje de error con el estilo del segundo login */}
            {error && (
              <div className="sysacad-error-message" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#fee2e2',
                color: '#991b1b',
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '14px'
              }}>
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="sysacad-form">
              {/* Email (el login real todavía no soporta legajo, solo email) */}
              <div className="sysacad-field">
                <label htmlFor="legajo" className="sysacad-label">
                  EMAIL
                </label>
                <div
                  className={
                    "sysacad-input-row" +
                    (focused === "legajo" ? " sysacad-input-row--focused" : "")
                  }
                >
                  <input
                    id="legajo"
                    type="email"
                    autoComplete="username"
                    value={legajo}
                    onChange={(e) => setLegajo(e.target.value)}
                    onFocus={() => setFocused("legajo")}
                    onBlur={() => setFocused(null)}
                    placeholder="admin@sga.local"
                    className="sysacad-input"
                  />
                </div>
              </div>

              {/* Contraseña */}
              <div className="sysacad-field">
                <div className="sysacad-label-row">
                  <label htmlFor="password" className="sysacad-label">
                    CONTRASEÑA
                  </label>
                  <a href="#" className="sysacad-link">
                    ¿Olvidaste tu contraseña?
                  </a>
                </div>
                <div
                  className={
                    "sysacad-input-row" +
                    (focused === "password" ? " sysacad-input-row--focused" : "")
                  }
                >
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocused("password")}
                    onBlur={() => setFocused(null)}
                    placeholder="••••••••"
                    className="sysacad-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    className="sysacad-eye-btn"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <label className="sysacad-checkbox-row">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="sysacad-checkbox"
                />
                <span>Recordarme</span>
              </label>

<<<<<<< HEAD
              <button type="submit" className="sysacad-submit" disabled={loading}>
                {loading ? "INGRESANDO..." : "INGRESAR"}
=======
              <button
                type="submit"
                className="sysacad-submit"
                disabled={loading}
              >
                {loading ? 'INGRESANDO...' : 'INGRESAR'}
>>>>>>> origin/develop
              </button>
            </form>

            <p className="sysacad-footer-note">
              ¿Problemas para acceder? Comunicate con la secretaria de la facultad.
            </p>
          </div>
        </div>
      </div>



    </div>
  );
}