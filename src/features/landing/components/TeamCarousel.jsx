import { useEffect, useRef, useState } from "react";

// Velocidad del carrusel en píxeles por segundo: subila para que vaya más rápido.
const VELOCIDAD = 90;
// Duración (ms) del desplazamiento cuando se usan las flechas.
const PASO_MS = 450;

function iniciales(nombre = "") {
  return nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");
}

const reducirMovimiento = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function Tarjeta({ miembro, oculta }) {
  const { nombre, rol, foto, github, linkedin } = miembro;
  // En las copias duplicadas (que solo sirven para el bucle visual) los links
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

// Carrusel infinito en movimiento constante con flechas para avanzar o retroceder.
// El movimiento lo maneja requestAnimationFrame (así las flechas pueden mover el
// carrusel con suavidad sin cortar el bucle). Se pausa con el mouse, con el foco
// o con el botón, y no se anima si el usuario prefiere menos movimiento.
function TeamCarousel({ miembros }) {
  const [pausado, setPausado] = useState(false);
  const marqueeRef = useRef(null);
  const trackRef = useRef(null);
  const setRef = useRef(null);
  const estado = useRef({
    offset: 0,
    tween: null,
    pausaManual: false,
    pausaHover: false,
    pausaFoco: false,
  });

  useEffect(() => {
    if (reducirMovimiento()) return undefined;
    const track = trackRef.current;
    const e = estado.current;
    let raf;
    let ultimo = performance.now();

    const tick = (ahora) => {
      const dt = Math.min((ahora - ultimo) / 1000, 0.05);
      ultimo = ahora;
      const ancho = setRef.current ? setRef.current.offsetWidth : 0;

      if (ancho > 0) {
        if (e.tween) {
          const t = Math.min((ahora - e.tween.inicio) / PASO_MS, 1);
          e.offset = e.tween.desde + (e.tween.hasta - e.tween.desde) * (1 - (1 - t) ** 3);
          if (t === 1) e.tween = null;
        } else {
          if (!e.pausaManual && !e.pausaHover && !e.pausaFoco) e.offset += VELOCIDAD * dt;
          e.offset = ((e.offset % ancho) + ancho) % ancho;
        }
        // Hay 3 copias del grupo de tarjetas: se muestra la del medio, así hay
        // contenido de sobra a ambos lados mientras se mueve.
        track.style.transform = `translate3d(${-(e.offset + ancho / 2)}px, 0, 0)`;
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [miembros.length]);

  const mover = (direccion) => {
    const track = trackRef.current;
    const card = track && track.querySelector(".landing-team__card");
    if (!card) return;
    const margen = parseFloat(getComputedStyle(card).marginRight) || 0;
    const paso = card.offsetWidth + margen;

    // Con "reducir movimiento" no hay animación: se desplaza el contenedor a mano.
    if (reducirMovimiento()) {
      marqueeRef.current?.scrollBy({ left: direccion * paso, behavior: "auto" });
      return;
    }

    const e = estado.current;
    const ancho = setRef.current ? setRef.current.offsetWidth : 0;
    if (!ancho) return;
    // Si ya se estaba moviendo, los clics seguidos se acumulan.
    const base = e.tween ? e.tween.hasta : e.offset;
    e.tween = {
      desde: e.offset,
      hasta: base + direccion * paso,
      inicio: performance.now(),
    };
  };

  const alternarPausa = () => {
    estado.current.pausaManual = !estado.current.pausaManual;
    setPausado(estado.current.pausaManual);
  };

  return (
    <div className="landing-team">
      <div className="landing-team__head">
        <h3>Equipo</h3>
        <button
          type="button"
          className="landing-team__pause"
          onClick={alternarPausa}
          aria-pressed={pausado}
        >
          {pausado ? "Reanudar" : "Pausar"}
        </button>
      </div>

      <div
        className="landing-team__stage"
        onMouseEnter={() => {
          estado.current.pausaHover = true;
        }}
        onMouseLeave={() => {
          estado.current.pausaHover = false;
        }}
        onFocus={() => {
          estado.current.pausaFoco = true;
        }}
        onBlur={(ev) => {
          if (!ev.currentTarget.contains(ev.relatedTarget)) estado.current.pausaFoco = false;
        }}
      >
        <button
          type="button"
          className="landing-team__arrow landing-team__arrow--prev"
          onClick={() => mover(-1)}
          aria-label="Integrante anterior"
        >
          <span aria-hidden="true">←</span>
        </button>

        <div className="landing-marquee" ref={marqueeRef}>
          <div className="landing-marquee__track" ref={trackRef}>
            <ul className="landing-marquee__set" aria-label="Integrantes del proyecto" ref={setRef}>
              {miembros.map((m) => (
                <Tarjeta key={m.nombre} miembro={m} />
              ))}
            </ul>
            <ul className="landing-marquee__set" aria-hidden="true">
              {miembros.map((m) => (
                <Tarjeta key={m.nombre} miembro={m} oculta />
              ))}
            </ul>
            <ul className="landing-marquee__set" aria-hidden="true">
              {miembros.map((m) => (
                <Tarjeta key={m.nombre} miembro={m} oculta />
              ))}
            </ul>
          </div>
        </div>

        <button
          type="button"
          className="landing-team__arrow landing-team__arrow--next"
          onClick={() => mover(1)}
          aria-label="Integrante siguiente"
        >
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  );
}

export default TeamCarousel;