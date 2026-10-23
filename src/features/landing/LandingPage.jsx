import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import ThemeToggle from "../../shared/ui/ThemeToggle";
import TeamCarousel from "./components/TeamCarousel";
import utnLogo from "../auth/login/components/login/utn-logo.jpg";
import "./LandingPage.css";

const LOGIN_PATH = "/login";
const FORGOT_PASSWORD_PATH = "/forgot-password";


const EQUIPO = [
  { nombre: "Diego Petrella", rol: "Backend-Frontend" },
  { nombre: "Agustin Camera", rol: "Backend-Frontend" },
  { nombre: "Tomas Carimando", rol: "Backend" },
  { nombre: "Andres Fernandez", rol: "Frontend" },
  { nombre: "Santiago Diaz", rol: "Backend-Frontend" },
];

const funciones = [
  {
    titulo: "Inscripción a cursadas",
    texto:
      "Elegí comisión y horario desde tu casa, con las correlativas verificadas automáticamente.",
  },
  {
    titulo: "Mesas de examen",
    texto:
      "Anotate a finales y date de baja cuando lo necesites, con confirmación al instante.",
  },
  {
    titulo: "Notas e historial",
    texto:
      "Consultá tus notas, tus materias en curso y las que ya regularizaste o aprobaste.",
  },
  {
    titulo: "Calendario académico",
    texto:
      "Mirá clases, mesas y fechas importantes de tu cursada en una agenda semanal.",
  },
  {
    titulo: "Certificados y equivalencias",
    texto:
      "Pedí certificados y equivalencias, y seguí el estado de cada trámite sin ir a la sede.",
  },
  {
    titulo: "Comisiones y asistencia",
    texto:
      "Los docentes toman asistencia y cargan notas de cada comisión desde el mismo sistema.",
  },
];

const roles = [
  {
    nombre: "Alumnos",
    texto: "Cursadas, finales, notas y trámites en un solo panel.",
  },
  {
    nombre: "Docentes",
    texto: "Listados de alumnos por comisión, asistencia y carga de notas.",
  },
  {
    nombre: "Bedelía",
    texto: "Gestión de comisiones, aulas, horarios y mesas de examen.",
  },
  {
    nombre: "Administración",
    texto: "Carreras, materias, planes de estudio, usuarios y auditoría.",
  },
];

const pasos = [
  { titulo: "Ingresá", texto: "Entrá con tu usuario y contraseña de la facultad." },
  { titulo: "Elegí qué hacer", texto: "Tu panel muestra solo lo que podés hacer según tu rol." },
  { titulo: "Listo", texto: "Cada acción queda confirmada en pantalla y registrada en tu historial." },
];

function Landing() {
  const rootRef = useRef(null);

  // Animación de entrada al hacer scroll (sin librerías).
  // Si el usuario prefiere menos movimiento, no se activa nada.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !("IntersectionObserver" in window)
    ) {
      return undefined;
    }

    root.classList.add("js-reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    root.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
      root.classList.remove("js-reveal");
    };
  }, []);

  return (
    <div className="landing" ref={rootRef}>
      <header className="landing-nav">
        <div className="landing-container landing-nav__inner">
          <a href="#inicio" className="landing-brand">
            <img src={utnLogo} alt="UTN" className="landing-brand__logo" />
            <span>SysAcad</span>
          </a>

          <nav className="landing-nav__links" aria-label="Secciones">
            <a href="#funciones">Funciones</a>
            <a href="#roles">Para quién</a>
            <a href="#como-funciona">Cómo funciona</a>
            <a href="#preguntas">Preguntas</a>
            <a href="#proyecto">Proyecto</a>
          </nav>

          <div className="landing-nav__actions">
            <Link to={LOGIN_PATH} className="landing-btn landing-btn--primary">
              Ingresar al SysAcad
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section id="inicio" className="landing-hero">
          <div className="landing-container landing-hero__inner">
            <div className="landing-hero__copy">
              <h1>La gestión académica de la UTN, simple y desde cualquier lugar</h1>
              <p>
                SysAcad Chacabuco reúne inscripciones, mesas de examen, notas y
                trámites en una sola plataforma pensada para alumnos, docentes
                y bedelía de la extensión áulica.
              </p>
              <div className="landing-hero__actions">
                <Link to={LOGIN_PATH} className="landing-btn landing-btn--primary landing-btn--lg">
                  Ingresar al SysAcad
                </Link>
                <a href="#funciones" className="landing-btn landing-btn--ghost landing-btn--lg">
                  Ver funciones
                </a>
              </div>
            </div>

            <div className="landing-hero__panel" aria-hidden="true">
              <div className="landing-panel">
                <div className="landing-panel__bar">
                  <span />
                  <span />
                  <span />
                </div>
                <div className="landing-panel__body">
                  <p className="landing-panel__title">Mis cursadas</p>
                  <ul>
                    <li>
                      <span>Programacion IV</span>
                      <em className="tag tag--ok">Inscripto</em>
                    </li>
                    <li>
                      <span>Legislación</span>
                      <em className="tag tag--ok">Inscripto</em>
                    </li>
                    <li>
                      <span>Metodología</span>
                      <em className="tag tag--wait">Pendiente</em>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="funciones" className="landing-section">
          <div className="landing-container">
            <div className="reveal">
              <h2>Todo lo que necesitás para cursar</h2>
              <p className="landing-section__lead">
                Menos papeles y menos viajes a la sede: las gestiones habituales
                se resuelven online.
              </p>
            </div>
            <div className="landing-grid">
              {funciones.map((f) => (
                <article key={f.titulo} className="landing-card reveal">
                  <h3>{f.titulo}</h3>
                  <p>{f.texto}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="roles" className="landing-section landing-section--alt">
          <div className="landing-container">
            <div className="reveal">
              <h2>Un sistema para cada rol</h2>
              <p className="landing-section__lead">
                Cada persona ve únicamente las herramientas que le corresponden.
              </p>
            </div>
            <div className="landing-roles reveal">
              {roles.map((r) => (
                <div key={r.nombre} className="landing-role">
                  <h3>{r.nombre}</h3>
                  <p>{r.texto}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="como-funciona" className="landing-section">
          <div className="landing-container">
            <h2 className="reveal">Cómo funciona</h2>
            <ol className="landing-steps">
              {pasos.map((p, i) => (
                <li key={p.titulo} className="reveal">
                  <span className="landing-steps__n">{i + 1}</span>
                  <div>
                    <h3>{p.titulo}</h3>
                    <p>{p.texto}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="preguntas" className="landing-section landing-section--alt">
          <div className="landing-container landing-faq">
            <h2 className="reveal">Preguntas frecuentes</h2>
            <div className="landing-faq__list reveal">
              <details>
                <summary>¿Cómo ingreso por primera vez?</summary>
                <p>
                  Ingresá con las credenciales que te asignó la facultad. En el
                  primer acceso el sistema puede pedirte verificar tu email y
                  completar tu perfil.
                </p>
              </details>
              <details>
                <summary>Olvidé mi contraseña, ¿qué hago?</summary>
                <p>
                  Podés restablecerla desde{" "}
                  <Link to={FORGOT_PASSWORD_PATH}>esta pantalla</Link>: te
                  enviamos un enlace al email registrado.
                </p>
              </details>
              <details>
                <summary>¿Quiénes pueden usar el sistema?</summary>
                <p>
                  Alumnos, docentes, bedelía y administración. Cada rol accede
                  solo a las funciones que le corresponden.
                </p>
              </details>
              <details>
                <summary>¿Qué puedo hacer como alumno?</summary>
                <p>
                  Inscribirte a cursadas y mesas de examen, ver tus notas e
                  historial, consultar el calendario académico y pedir
                  certificados y equivalencias.
                </p>
              </details>
              <details>
                <summary>¿Necesito instalar algo?</summary>
                <p>
                  No. Funciona desde el navegador, con el modo claro u oscuro
                  que prefieras.
                </p>
              </details>
            </div>
          </div>
        </section>

        <section id="proyecto" className="landing-section">
          <div className="landing-container">
            <div className="reveal">
              <h2>Sobre el proyecto</h2>
              <p className="landing-section__lead">
                SysAcad Chacabuco es un proyecto académico desarrollado por
                estudiantes de la UTN Facultad Regional San Nicolás, extensión
                áulica Chacabuco. Está construido con React, Vite y React
                Router en el frontend, y CodeIgniter 4 en el backend.
              </p>
            </div>

            {EQUIPO.length > 0 && (
              <div className="reveal">
                <TeamCarousel miembros={EQUIPO} />
              </div>
            )}
          </div>
        </section>

        <section className="landing-cta">
          <div className="landing-container landing-cta__inner">
            <h2>Entrá a tu panel académico</h2>
            <p>Usá las credenciales que te dio la facultad.</p>
            <Link to={LOGIN_PATH} className="landing-btn landing-btn--light landing-btn--lg">
              Ingresar al SysAcad
            </Link>
          </div>
        </section>
      </main>

      <footer id="contacto" className="landing-footer">
        <div className="landing-container landing-footer__inner">
          <div>
            <strong>SysAcad Chacabuco</strong>
            <p>
              UTN Facultad Regional San Nicolás, extensión áulica Chacabuco.
            </p>
          </div>
          <p className="landing-footer__note">
            Proyecto desarrollado por estudiantes de la extensión áulica.
          </p>

          {/* Flotante en desktop; en celular queda en el footer (ver CSS) */}
          <div className="landing-theme-fab">
            <ThemeToggle />
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Landing;