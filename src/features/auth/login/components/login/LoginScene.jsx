// Escena animada del login: un estudiante con mochila camina hacia la facultad.
// Se controla solo con la prop `phase`:
//   "idle"        -> parado, respirando
//   "walking"     -> camina mientras se espera la respuesta del servidor
//   "entering"    -> login correcto: corre hasta la puerta
//   "celebrating" -> llegó: salta con los brazos en alto y sale confeti
//   "inside"      -> entra por la puerta
//   "failed"      -> login incorrecto: se enoja, vuelve al inicio y patalea
// `rage` (1 a 3) sube el enojo con cada intento fallido seguido:
//   1 -> enojado, 2 -> furioso (más humo, venita, pataleo fuerte),
//   3 -> berrinche total (cara roja oscura, tormenta con rayos sobre la cabeza)
// Todo el movimiento está en loginScene.css (SVG + CSS, sin librerías).
import "./LoginScene.css";

const SKIN = "#f1c9a5";

const COLORES_CONFETI = ["#f2a900", "#ffffff", "#66c994", "#9fc2f2", "#ff9a82"];

// Piezas de confeti: salen en abanico hacia arriba desde la puerta.
const CONFETI = Array.from({ length: 16 }, (_, i) => {
  const angulo = (Math.PI * (i + 0.5)) / 16;
  const fuerza = 36 + (i % 4) * 13;
  return {
    dx: Math.round(-Math.cos(angulo) * fuerza * 1.5),
    dy: Math.round(-Math.sin(angulo) * fuerza),
    rot: (i % 2 ? 1 : -1) * (180 + i * 25),
    color: COLORES_CONFETI[i % COLORES_CONFETI.length],
    delay: (i % 4) * 0.05,
  };
});

function Boca({ phase }) {
  if (phase === "failed") {
    return <path d="M2.5 -56.5 Q5.5 -59.5 8 -56.5" stroke="#8a3f2a" strokeWidth="1.2" strokeLinecap="round" fill="none" />;
  }
  if (phase === "celebrating" || phase === "inside") {
    return <path d="M2 -58.5 Q5 -54 8.5 -58.5 Z" fill="#8a3f2a" />;
  }
  return <path d="M3 -57.5 L7 -57.5" stroke="#8a5a44" strokeWidth="1" strokeLinecap="round" />;
}

// Color y opacidad del enojo en la cara según el nivel
const ENOJO_CARA = {
  1: { fill: "#e5533d", opacity: 0.55 },
  2: { fill: "#d63a25", opacity: 0.8 },
  3: { fill: "#b32218", opacity: 0.95 },
};

export default function LoginScene({ phase = "idle", variant = "panel", rage = 1 }) {
  const enojado = phase === "failed";
  const nivel = Math.min(Math.max(rage, 1), 3);
  const cara = ENOJO_CARA[nivel];

  return (
    <div
      className={`login-scene login-scene--${variant}`}
      data-phase={phase}
      data-rage={nivel}
      aria-hidden="true"
    >
      <svg className="login-scene__svg" viewBox="0 0 400 170" focusable="false">
        {/* Nubes */}
        <g transform="translate(0 26)">
          <g className="login-scene__cloud login-scene__cloud--a">
            <ellipse cx="0" cy="0" rx="24" ry="7" />
            <ellipse cx="-12" cy="-5" rx="11" ry="8" />
            <ellipse cx="8" cy="-7" rx="13" ry="9" />
          </g>
        </g>
        <g transform="translate(0 54)">
          <g className="login-scene__cloud login-scene__cloud--b">
            <ellipse cx="0" cy="0" rx="18" ry="5.5" />
            <ellipse cx="-8" cy="-4" rx="8" ry="6" />
            <ellipse cx="6" cy="-5" rx="10" ry="7" />
          </g>
        </g>

        {/* Piso */}
        <rect x="0" y="140" width="400" height="30" fill="rgba(0,0,0,0.18)" />
        <line x1="0" y1="140" x2="400" y2="140" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />

        {/* Facultad */}
        <g>
          <rect x="276" y="132" width="96" height="8" fill="rgba(255,255,255,0.18)" />
          <rect x="282" y="126" width="84" height="6" fill="rgba(255,255,255,0.22)" />
          <rect x="286" y="68" width="76" height="58" fill="rgba(255,255,255,0.14)" />
          <polygon points="280,68 324,40 368,68" fill="rgba(255,255,255,0.24)" />
          <text
            x="324"
            y="63"
            textAnchor="middle"
            fontSize="10"
            fontWeight="700"
            fill="rgba(255,255,255,0.92)"
            fontFamily="Georgia, serif"
          >
            UTN
          </text>
          <rect x="290" y="68" width="6" height="58" fill="rgba(255,255,255,0.32)" />
          <rect x="352" y="68" width="6" height="58" fill="rgba(255,255,255,0.32)" />
          <rect x="299" y="76" width="10" height="10" fill="rgba(255,255,255,0.28)" />
          <rect x="339" y="76" width="10" height="10" fill="rgba(255,255,255,0.28)" />
          {/* Puerta: interior oscuro + hoja que se abre */}
          <rect x="312" y="92" width="24" height="34" fill="#0e1520" />
          <rect className="login-scene__door-leaf" x="312" y="92" width="24" height="34" fill="#d9a441" />
        </g>

        {/* Estudiante: el origen (0,0) son los pies */}
        <g transform="translate(48 140)">
          <g className="login-scene__walker">
            <g transform={enojado ? "scale(-1 1)" : undefined}>
              <g className="login-scene__person">
                {/* Piernas */}
                <g className="login-scene__leg login-scene__leg--b">
                  <rect x="-3.5" y="-28" width="7" height="22" rx="3.5" fill="#6d8fbe" />
                  <rect x="-4" y="-8" width="11" height="7" rx="3.5" fill="#dfe6ef" />
                </g>
                <g className="login-scene__leg login-scene__leg--a">
                  <rect x="-3.5" y="-28" width="7" height="22" rx="3.5" fill="#8fb0dc" />
                  <rect x="-4" y="-8" width="11" height="7" rx="3.5" fill="#ffffff" />
                </g>

                {/* Torso, cabeza, mochila y brazos (suben y bajan al caminar) */}
                <g className="login-scene__bob">
                  <g className="login-scene__arm login-scene__arm--b">
                    <rect x="-3" y="-50" width="6" height="19" rx="3" fill="#cfd8e6" />
                    <circle cx="0" cy="-30" r="3" fill={SKIN} />
                  </g>
                  <rect x="-19" y="-50" width="12" height="22" rx="5" fill="#f2a900" />
                  <rect x="-19" y="-41" width="12" height="2.5" fill="rgba(0,0,0,0.18)" />
                  <rect x="-9" y="-52" width="18" height="26" rx="7" fill="#ffffff" />
                  <path d="M-4 -51 L-8 -34" stroke="#f2a900" strokeWidth="2.5" strokeLinecap="round" />

                  {/* Cabeza */}
                  <circle cx="1" cy="-62" r="9" fill={SKIN} />
                  {enojado && <circle cx="1" cy="-62" r="9" fill={cara.fill} opacity={cara.opacity} />}
                  <path
                    d="M-9.5 -61 C-10 -73 8 -75 10 -64 C5 -67 -3 -66 -9.5 -61 Z"
                    fill="#2b2118"
                  />
                  <circle cx="5" cy="-62" r="1.2" fill="#14181d" />
                  {enojado && (
                    <path
                      d="M1.5 -66.5 L8.5 -64"
                      stroke="#2b2118"
                      strokeWidth={nivel >= 2 ? 2.4 : 1.6}
                      strokeLinecap="round"
                    />
                  )}
                  <Boca phase={phase} />

                  {/* Humo de enojo */}
                  <circle className="login-scene__steam login-scene__steam--a" cx="-3" cy="-76" r="3" />
                  <circle className="login-scene__steam login-scene__steam--b" cx="6" cy="-78" r="2.4" />
                  {enojado && nivel >= 2 && (
                    <>
                      <circle className="login-scene__steam login-scene__steam--c" cx="-8" cy="-74" r="2.6" />
                      <circle className="login-scene__steam login-scene__steam--d" cx="11" cy="-75" r="2.2" />
                      {/* Venita de enojo */}
                      <path
                        className="login-scene__vein"
                        d="M10 -76 q2.5 1 2.5 3.5 M16 -76 q-2.5 1 -2.5 3.5 M10 -70 q2.5 -1 2.5 -3.5 M16 -70 q-2.5 -1 -2.5 -3.5"
                        stroke="#e5533d"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        fill="none"
                      />
                    </>
                  )}
                  {/* Berrinche total: tormenta con rayos sobre la cabeza */}
                  {enojado && nivel >= 3 && (
                    <g className="login-scene__storm">
                      <ellipse cx="1" cy="-92" rx="20" ry="6" />
                      <ellipse cx="-9" cy="-97" rx="10" ry="7" />
                      <ellipse cx="9" cy="-99" rx="12" ry="8" />
                      <polygon
                        className="login-scene__bolt"
                        points="2,-88 -3,-78 1,-78 -2,-70 7,-82 2,-82 5,-88"
                      />
                    </g>
                  )}

                  <g className="login-scene__arm login-scene__arm--a">
                    <rect
                      x="-3"
                      y="-50"
                      width="6"
                      height="19"
                      rx="3"
                      fill="#ffffff"
                      stroke="rgba(0,0,0,0.18)"
                      strokeWidth="0.8"
                    />
                    <circle cx="0" cy="-30" r="3" fill={SKIN} />
                  </g>
                </g>
              </g>
            </g>
          </g>
        </g>

        {/* Confeti: sale de la puerta cuando festeja */}
        <g transform="translate(324 92)">
          {CONFETI.map((c, i) => (
            <rect
              key={i}
              className="login-scene__confetti"
              x="-2"
              y="-3.5"
              width="4"
              height="7"
              rx="1"
              fill={c.color}
              style={{
                "--dx": `${c.dx}px`,
                "--dy": `${c.dy}px`,
                "--rot": `${c.rot}deg`,
                animationDelay: `${c.delay}s`,
              }}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}