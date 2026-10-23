import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, Sun, Moon } from "lucide-react";
import { SiInstagram, SiFacebook, SiX, SiYoutube } from "@icons-pack/react-simple-icons";
import { useAuth } from "../../../../../context/AuthContext";
import { useTheme } from "../../../../../context/ThemeContext";
import { getDefaultRouteForRole } from "../../../../layout/roleLinks";
import { getErrorMessage, SESSION_EXPIRED_KEY } from "../../../../../shared/api/api";
import LoginScene from "./LoginScene";
import { PERSONAJES, elegirPersonaje } from "./personajes";
import utnLogo from "./utn-logo.jpg";
import "./login.css";
import "./LoginParchment.css";

// Tiempos de la animación de login correcto. Se suman a la espera real del
// servidor: corre a la puerta -> festeja -> entra. Para acortarla, bajá estos
// valores (CELEBRATE_MS en 0 saltea el festejo).
const RUN_MS = 700;
const CELEBRATE_MS = 800;
const ENTER_MS = 350;
// Cuánto dura el enojo cuando el login falla (vuelve al inicio y patalea).
// Con cada fallo seguido el enojo sube de nivel (1 a 5) y dura más.
const FAIL_MS_POR_NIVEL = [2100, 2700, 3400, 4000, 4600];
// Lo que grita el estudiante según el nivel de enojo (1 a 5).
const GRITOS = ["", "¡OTRA VEZ!", "¡¡BASTA!!", "¡NO PUEDE SER!", "¡¡AAAARGH!!"];

// Para fijar siempre el mismo personaje (por ejemplo en una demo) poné su id acá:
// "el-corto" | "ella-cola" | "ella-larga-pollera" | "el-rulos" | "ella-rulos".
// En null, cada vez que se entra al login aparece uno distinto al azar.
const PERSONAJE_FIJO = null;

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Desde qué dispositivo se está ingresando: "movil" o "notebook" (PC / notebook).
// Se detecta localmente en el navegador, no se envía a ningún lado.
// En el enojo nivel 4+ el estudiante tira su celular o su notebook contra la facultad.
function detectarDispositivo() {
  if (typeof navigator === "undefined") return "notebook";
  if (navigator.userAgentData?.mobile) return "movil";
  const ua = navigator.userAgent || "";
  const tactil = navigator.maxTouchPoints > 1;
  // iPadOS se identifica como "Macintosh" pero tiene pantalla táctil
  if (/Android|iPhone|iPod|iPad|Mobile/i.test(ua) || (/Macintosh/.test(ua) && tactil)) return "movil";
  return "notebook";
}

// Qué dice el estudiante (globo de diálogo) según lo que salió mal.
// Errores de validación: se detectan antes de llamar al servidor.
function validarCampos(email, password) {
  const emailOk = email.trim();
  const passOk = password.trim();
  if (!emailOk && !passOk) {
    return { error: "Completá email y contraseña para continuar.", globo: "¡Faltan el email y la contraseña!" };
  }
  if (!emailOk) {
    return { error: "Completá tu email para continuar.", globo: "¡Te faltó el email!" };
  }
  if (!passOk) {
    return { error: "Completá tu contraseña para continuar.", globo: "¡Te faltó la contraseña!" };
  }
  // Formato mínimo (algo@algo): el servidor valida el resto
  if (!/^[^\s@]+@[^\s@]+$/.test(emailOk)) {
    return { error: "Revisá el email: no parece válido.", globo: "¡Ese email no parece válido!" };
  }
  return null;
}

// Errores que devuelve el servidor. Por seguridad el backend puede no aclarar si
// falló el email o la contraseña; si el mensaje lo dice, el globo lo refleja.
function globoDeFallo(err) {
  const texto = String(getErrorMessage(err) || "").toLowerCase();
  const status = err?.response?.status;
  const sinRespuesta = !err?.response && (err?.code === "ERR_NETWORK" || /network/i.test(err?.message || ""));

  if (sinRespuesta) return "¡No llego al servidor! Revisá tu conexión";
  if (status === 429) return "¡Demasiados intentos! Esperá un ratito";
  if (status >= 500) return "¡Falló el servidor! No fue tu culpa";
  if (/(no existe|no encontr|inexistente|no registrad|not found)/.test(texto) && /(email|correo|usuario)/.test(texto)) {
    return "¡Ese email no está registrado!";
  }
  if (/(contrase|password)/.test(texto) && !/(email|correo|usuario)/.test(texto)) {
    return "¡Esa contraseña no es!";
  }
  return "¡Email o contraseña incorrectos!";
}

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const [legajo, setLegajo] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [focused, setFocused] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  // Estado de la escena animada: idle | walking | entering | celebrating | inside | failed
  const [scenePhase, setScenePhase] = useState("idle");
  const [rage, setRage] = useState(1);
  const [dialogo, setDialogo] = useState(null);
  const [dispositivo] = useState(detectarDispositivo);
  const [personaje] = useState(
    () => PERSONAJES.find((p) => p.id === PERSONAJE_FIJO) ?? elegirPersonaje()
  );
  const idDialogo = useRef(0);
  const fallos = useRef(0);
  const failTimer = useRef(null);
  // El interceptor de la API deja esta marca cuando un 401 cierra la sesión.
  const [expiredNotice] = useState(() => {
    try {
      const expired = sessionStorage.getItem(SESSION_EXPIRED_KEY) === "1";
      sessionStorage.removeItem(SESSION_EXPIRED_KEY);
      return expired;
    } catch {
      return false;
    }
  });

  useEffect(() => () => clearTimeout(failTimer.current), []);

  // Dispara el enojo del estudiante con su globo de diálogo.
  // demora: segundos hasta que aparece el globo (si camina de vuelta, tarda más).
  const mostrarFallo = ({ texto, nivel, demora, estatico }) => {
    idDialogo.current += 1;
    const grito = GRITOS[nivel - 1] ?? "";
    setRage(nivel);
    setDialogo({ id: idDialogo.current, texto, grito, demora, estatico });
    setScenePhase("failed");
    clearTimeout(failTimer.current);
    // Lo que dura el enojo, y que el globo se llegue a leer
    const ms = Math.max(FAIL_MS_POR_NIVEL[nivel - 1], demora * 1000 + 2400);
    failTimer.current = setTimeout(() => setScenePhase("idle"), ms);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const invalido = validarCampos(legajo, password);
    if (invalido) {
      setError(invalido.error);
      // Error de validación: ya está en el inicio, se enoja ahí mismo (no suma fallos)
      mostrarFallo({ texto: invalido.globo, nivel: 1, demora: 0.1, estatico: true });
      return;
    }
    setError("");
    setLoading(true);
    clearTimeout(failTimer.current);
    setScenePhase("walking");
    try {
      // El campo se sigue llamando "legajo" en la UI (así lo diseñaron), pero
      // el backend real solo tiene login por email todavía — se manda como email.
      const { user } = await login(legajo.trim(), password, remember);
      const destino = getDefaultRouteForRole(user?.role);

      // Con "reducir movimiento" activado no se espera ninguna animación.
      const reducirMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!reducirMovimiento) {
        setScenePhase("entering");
        await esperar(RUN_MS);
        if (CELEBRATE_MS > 0) {
          setScenePhase("celebrating");
          await esperar(CELEBRATE_MS);
        }
        setScenePhase("inside");
        await esperar(ENTER_MS);
      }
      navigate(destino);
    } catch (err) {
      setError(getErrorMessage(err));
      fallos.current += 1;
      const nivel = Math.min(fallos.current, 5);
      // Vuelve caminando al inicio (~0.7 s) y recién ahí aparece el globo
      mostrarFallo({ texto: globoDeFallo(err), nivel, demora: 0.7, estatico: false });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sysacad-page">
      {/* Flecha para volver a la landing, arriba a la izquierda */}
      <Link to="/" className="sysacad-back" aria-label="Volver al inicio">
        <ArrowLeft size={18} aria-hidden="true" />
        <span>Volver</span>
      </Link>

      <div className="sysacad-wrapper">
        {/* Panel institucional */}
        <div className="sysacad-panel">
          <div className="sysacad-panel-texture" />
          <div className="sysacad-panel-top">
            <img src={utnLogo} alt="UTN Facultad Regional Chacabuco" className="sysacad-panel-logo" />
            <h1 className="sysacad-wordmark">SysAcad</h1>
            <p className="sysacad-panel-text">
              Tu gestión académica, en un solo lugar: notas, inscripciones y
              trámites de la facultad.
            </p>
          </div>

          <div className="sysacad-panel-scene">
            <LoginScene phase={scenePhase} variant="panel" rage={rage} dialogo={dialogo} dispositivo={dispositivo} personaje={personaje} />
          </div>

          <div className="sysacad-panel-bottom">
            <p className="sysacad-panel-note">
              Acceso exclusivo para alumnos y personal del Aula Chacabuco —
              UTN Facultad Regional Chacabuco.
            </p>
          </div>
        </div>

        {/* Panel de login */}
        <div className="sysacad-form-side">
          <div className="sysacad-form-box">
            {/* Papel y sello del pergamino (decorativos, ver loginParchment.css) */}
            <div className="sysacad-paper" aria-hidden="true" />
            <span className="sysacad-seal" aria-hidden="true">
              UTN
            </span>
            <button
              type="button"
              onClick={toggleDarkMode}
              aria-label={darkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
              className="sysacad-theme-toggle"
              title={darkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <div className="sysacad-mobile-header">
              <img src={utnLogo} alt="UTN Facultad Regional Chacabuco" className="sysacad-mobile-logo" />
              <div>
                <h1 className="sysacad-wordmark-sm">SysAcad</h1>
                <p className="sysacad-eyebrow-sm">Aula Chacabuco</p>
              </div>
            </div>

            <div className="sysacad-mobile-scene">
              <LoginScene phase={scenePhase} variant="mobile" rage={rage} dialogo={dialogo} dispositivo={dispositivo} personaje={personaje} />
            </div>

            <h2 className="sysacad-title">Bienvenido de nuevo</h2>
            <p className="sysacad-subtitle">Ingresá con tu email para continuar.</p>

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
                    autoComplete="username" inputMode="email"
                    value={legajo}
                    onChange={(e) => setLegajo(e.target.value)}
                    onFocus={() => setFocused("legajo")}
                    onBlur={() => setFocused(null)}
                    placeholder="tu-correo@ejemplo.com"
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
                  <Link to="/forgot-password" className="sysacad-link">
                    ¿Olvidaste tu contraseña?
                  </Link>
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

              {expiredNotice && !error && (
                <p className="sysacad-error" role="status">
                  Tu sesión expiró, ingresá de nuevo.
                </p>
              )}
              {error && (
                <p className="sysacad-error" role="alert">
                  {error}
                </p>
              )}

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

              {/* La escena es decorativa: esto anuncia el estado a lectores de pantalla */}
              <span className="sysacad-sr-only" role="status">
                {loading ? "Ingresando…" : ""}
              </span>
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
          © {new Date().getFullYear()} UTN Facultad Regional Chacabuco — Aula Chacabuco
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