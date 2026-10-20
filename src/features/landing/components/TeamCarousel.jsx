import { useState } from "react";

function iniciales(nombre = "") {
  return nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");
}

function Tarjeta({ miembro, oculta }) {
  const { nombre, rol, foto, github, linkedin } = miembro;
  // En la copia duplicada (que solo sirve para el bucle visual) los links
  // no deben recibir foco con el teclado.
  const tabIndex = oculta ? -1 : undefined;

  return (
    <li className="landing-team__card">
      <span className="landing-team__ring">
        {foto ? (
          <img src={foto} alt="" className="landing-team__avatar" />
        ) : (
          <span className="landing-team__avatar landing-team__avatar--initials" aria-hidden="true">
            {iniciales(nombre)}
          </span>
        )}
      </span>
      <strong>{nombre}</strong>
      {rol && <span className="landing-team__role">{rol}</span>}
      {(github || linkedin) && (
        <span className="landing-team__links">
          {github && (
            <a href={github} target="_blank" rel="noopener noreferrer" tabIndex={tabIndex}>
              GitHub
            </a>
          )}
          {linkedin && (
            <a href={linkedin} target="_blank" rel="noopener noreferrer" tabIndex={tabIndex}>
              LinkedIn
            </a>
          )}
        </span>
      )}
    </li>
  );
}

// Carrusel infinito en movimiento constante (marquee). Se pausa al pasar el
// mouse o con el botón, y se desactiva solo si el usuario prefiere menos movimiento.
function TeamCarousel({ miembros }) {
  const [pausado, setPausado] = useState(false);

  return (
    <div className="landing-team">
      <div className="landing-team__head">
        <h3>Equipo</h3>
        <button
          type="button"
          className="landing-team__pause"
          onClick={() => setPausado((p) => !p)}
          aria-pressed={pausado}
        >
          {pausado ? "Reanudar" : "Pausar"}
        </button>
      </div>

      <div className="landing-marquee" style={{ "--marquee-duration": `${miembros.length * 7}s` }}>
        <div className={`landing-marquee__track${pausado ? " is-paused" : ""}`}>
          <ul className="landing-marquee__set" aria-label="Integrantes del proyecto">
            {miembros.map((m) => (
              <Tarjeta key={m.nombre} miembro={m} />
            ))}
          </ul>
          <ul className="landing-marquee__set" aria-hidden="true">
            {miembros.map((m) => (
              <Tarjeta key={m.nombre} miembro={m} oculta />
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default TeamCarousel;