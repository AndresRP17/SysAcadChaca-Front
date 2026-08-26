import { useState } from "react";
import utnLogo from "./utn-logo.jpg";
import "./SysAcadLogin.css";

function EyeIcon({ open }) {
  return open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 3l18 18" />
      <path d="M10.6 5.2A10.9 10.9 0 0 1 12 5c7 0 11 7 11 7a17.9 17.9 0 0 1-3.6 4.5M6.6 6.6C3.7 8.3 1 12 1 12s4 7 11 7a10.7 10.7 0 0 0 4.4-.9" />
      <path d="M9.5 9.5a3 3 0 0 0 4.2 4.2" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M14 9h3V5.5h-3c-2 0-3.5 1.6-3.5 3.6V12H8v3.5h2.5V22H14v-6.5h2.7l.5-3.5h-3.2V9.4c0-.5.3-.9.9-.9Z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M4 4l16 16M20 4L4 20" />
    </svg>
  );
}

function YoutubeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="3" y="6" width="18" height="12" rx="3" />
      <path d="M10.5 9.5v5l4.5-2.5-4.5-2.5Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 2.5v2.5M12 19v2.5M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M2.5 12H5M19 12h2.5M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.8 6.8 0 0 0 10.5 10.5Z" />
    </svg>
  );
}

export default function SysAcadLogin() {
  const [darkMode, setDarkMode] = useState(false);
  const [legajo, setLegajo] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [focused, setFocused] = useState(null);
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!legajo.trim() || !password.trim()) {
      setError("Completá legajo y contraseña para continuar.");
      return;
    }
    setError("");
    // Acá iría la lógica real de autenticación.
  };

  return (
    <div className="sysacad-page" data-theme={darkMode ? "dark" : "light"}>
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
            <div className="sysacad-toggle-row">
              <button
                type="button"
                onClick={() => setDarkMode((d) => !d)}
                aria-label={darkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
                className="sysacad-theme-toggle"
              >
                {darkMode ? <SunIcon /> : <MoonIcon />}
              </button>
            </div>

            <div className="sysacad-mobile-header">
              <img src={utnLogo} alt="UTN San Nicolás - Aula Chacabuco" className="sysacad-mobile-logo" />
              <div>
                <h1 className="sysacad-wordmark-sm">SysAcad</h1>
                <p className="sysacad-eyebrow-sm">Aula Chacabuco</p>
              </div>
            </div>

            <h2 className="sysacad-title">Bienvenido de nuevo</h2>
            <p className="sysacad-subtitle">Ingresá con tu legajo para continuar.</p>

            <form onSubmit={handleSubmit} noValidate className="sysacad-form">
              {/* Legajo */}
              <div className="sysacad-field">
                <label htmlFor="legajo" className="sysacad-label">
                  LEGAJO
                </label>
                <div
                  className={
                    "sysacad-input-row" +
                    (focused === "legajo" ? " sysacad-input-row--focused" : "")
                  }
                >
                  <span className="sysacad-prefix">N°</span>
                  <input
                    id="legajo"
                    type="text"
                    inputMode="numeric"
                    autoComplete="username"
                    value={legajo}
                    onChange={(e) => setLegajo(e.target.value)}
                    onFocus={() => setFocused("legajo")}
                    onBlur={() => setFocused(null)}
                    placeholder="45678"
                    className="sysacad-input sysacad-input--mono"
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
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
              </div>

              {error && <p className="sysacad-error">{error}</p>}

              <label className="sysacad-checkbox-row">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="sysacad-checkbox"
                />
                <span>Recordarme en este equipo</span>
              </label>

              <button type="submit" className="sysacad-submit">
                INGRESAR
              </button>
            </form>

            <p className="sysacad-footer-note">
              ¿Problemas para acceder? Comunicate con Bedelía de tu facultad.
            </p>
          </div>
        </div>
      </div>

      {/* Footer con redes sociales */}
      <footer className="sysacad-footer">
        <p className="sysacad-footer-copy">
          © {new Date().getFullYear()} UTN Facultad Regional San Nicolás — Aula Chacabuco
        </p>
        <div className="sysacad-social-row">
          <a href="#" aria-label="Instagram" className="sysacad-social-link">
            <InstagramIcon />
          </a>
          <a href="#" aria-label="Facebook" className="sysacad-social-link">
            <FacebookIcon />
          </a>
          <a href="#" aria-label="X (Twitter)" className="sysacad-social-link">
            <XIcon />
          </a>
          <a href="#" aria-label="YouTube" className="sysacad-social-link">
            <YoutubeIcon />
          </a>
        </div>
      </footer>
    </div>
  );
}