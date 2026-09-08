import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { SiInstagram, SiFacebook, SiX, SiYoutube } from "@icons-pack/react-simple-icons";
import { useAuth } from "../../../../../context/AuthContext";
import { getDefaultRouteForRole } from "../../../../layout/roleLinks";
import utnLogo from "./utn-logo.jpg";
import "./login.css";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [legajo, setLegajo] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [focused, setFocused] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!legajo.trim() || !password.trim()) {
      setError("Completá email y contraseña para continuar.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      // El campo se sigue llamando "legajo" en la UI (así lo diseñaron), pero
      // el backend real solo tiene login por email todavía — se manda como email.
      const { user } = await login(legajo.trim(), password);
      navigate(getDefaultRouteForRole(user?.role));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sysacad-page">
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

              <button type="submit" className="sysacad-submit" disabled={loading}>
                {loading ? "INGRESANDO..." : "INGRESAR"}
              </button>
            </form>

            <p className="sysacad-footer-note">
              ¿Problemas para acceder? Comunicate con la secretaria de la facultad.
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
            <SiInstagram size={18} color="currentColor" />
          </a>
          <a href="#" aria-label="Facebook" className="sysacad-social-link">
            <SiFacebook size={18} color="currentColor" />
          </a>
          <a href="#" aria-label="X (Twitter)" className="sysacad-social-link">
            <SiX size={16} color="currentColor" />
          </a>
          <a href="#" aria-label="YouTube" className="sysacad-social-link">
            <SiYoutube size={18} color="currentColor" />
          </a>
        </div>
      </footer>
    </div>
  );
}
