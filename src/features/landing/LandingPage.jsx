import { Link } from "react-router-dom";
import "./landingPage.css";
import utnLogo from "../auth/login/components/login/utn-logo.jpg";

const LOGIN_PATH = "/login";

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
    titulo: "Notas y trayectoria",
    texto:
      "Consultá tus notas, tus materias en curso y las que ya regularizaste o aprobaste.",
  },
  {
    titulo: "Trámites y certificados",
    texto:
      "Pedí certificados y equivalencias, y seguí el estado de cada trámite sin ir a la sede.",
  },
];

const roles = [
  {
    nombre: "Alumnos",
    texto: "Cursadas, finales, notas y trámites en un solo panel.",
  },
  {
    nombre: "Docentes",
    texto: "Listados de alumnos por comisión y carga de notas.",
  },
  {
    nombre: "Bedelía",
    texto: "Gestión de comisiones, aulas, horarios y mesas de examen.",
  },
  {
    nombre: "Administración",
    texto: "Carreras, materias, planes de estudio y usuarios.",
  },
];

const pasos = [
  { titulo: "Ingresá", texto: "Entrá con tu usuario y contraseña de la facultad." },
  { titulo: "Elegí qué hacer", texto: "Tu panel muestra solo lo que podés hacer según tu rol." },
  { titulo: "Listo", texto: "Cada acción queda confirmada en pantalla y registrada en tu historial." },
];

function LandingPage() {
  return (
    <div className="landing">
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
            <a href="#contacto">Contacto</a>
          </nav>

          <Link to={LOGIN_PATH} className="landing-btn landing-btn--primary">
            Ingresar al SysAcad
          </Link>
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
                      <span>Investigación Operativa</span>
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
            <h2>Todo lo que necesitás para cursar</h2>
            <p className="landing-section__lead">
              Menos papeles y menos viajes a la sede: las gestiones habituales
              se resuelven online.
            </p>
            <div className="landing-grid">
              {funciones.map((f) => (
                <article key={f.titulo} className="landing-card">
                  <h3>{f.titulo}</h3>
                  <p>{f.texto}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="roles" className="landing-section landing-section--alt">
          <div className="landing-container">
            <h2>Un sistema para cada rol</h2>
            <p className="landing-section__lead">
              Cada persona ve únicamente las herramientas que le corresponden.
            </p>
            <div className="landing-roles">
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
            <h2>Cómo funciona</h2>
            <ol className="landing-steps">
              {pasos.map((p, i) => (
                <li key={p.titulo}>
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
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;