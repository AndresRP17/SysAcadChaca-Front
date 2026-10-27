// Escena animada del login: un estudiante con mochila camina hacia la facultad.
// Se controla solo con la prop `phase`:
//   "idle"        -> parado, respirando
//   "walking"     -> camina mientras se espera la respuesta del servidor
//   "entering"    -> login correcto: corre hasta la puerta
//   "celebrating" -> llegó: salta con los brazos en alto y sale confeti
//   "inside"      -> entra por la puerta
//   "failed"      -> login incorrecto: se enoja, vuelve al inicio y patalea
// `rage` (1 a 8) sube el enojo con cada intento fallido seguido:
//   1 -> enojado, 2 -> furioso (más humo, venita, pataleo fuerte),
//   3 -> berrinche (cara roja oscura, tormenta con rayos sobre la cabeza),
//   4 -> tira su celular o su notebook contra la facultad (rebota y cae al piso)
//        y el cielo se ilumina con relámpagos,
//   5 -> explota de furia: fuego en la cabeza, todo tiembla y además tira la mochila,
//   6 -> se tira al piso a patalear y a golpear el suelo, levantando polvo,
//   7 -> le cae un rayo: queda chamuscado, con el pelo parado y ojos de "x",
//   8 -> un OVNI lo abduce con su rayo tractor.
// `dispositivo` ("movil" | "notebook") decide qué tira en el nivel 4 y 5.
// `personaje` (ver personajes.js) define quién camina: colores y peinado.
// `dialogo` ({ id, texto, grito, demora, estatico }) muestra un globo de diálogo
// con lo que salió mal cuando phase === "failed". `estatico` = no camina de vuelta
// (se usa cuando el error es de validación y el estudiante ya está en el inicio).
// `dia` (true | false): de día hay sol, nubes blancas y pájaros; de noche, cielo estrellado,
// luna, farol y ventanas prendidas. La página lo conecta con el modo claro / oscuro.
// Todo el movimiento está en loginScene.css (SVG + CSS, sin librerías).
import { PERSONAJES } from "./personajes";
import "./loginScene.css";

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

// Estrellas del cielo nocturno: [x, y, radio, demora de titileo en segundos]
const ESTRELLAS = [
  [18, 16, 1.2, 0],
  [46, 42, 0.9, 1.1],
  [82, 14, 1.3, 2.0],
  [112, 54, 0.8, 0.6],
  [140, 26, 1.1, 1.7],
  [176, 10, 1.4, 0.3],
  [208, 46, 0.9, 2.4],
  [238, 18, 1.2, 1.3],
  [262, 62, 0.8, 0.9],
  [340, 14, 1.1, 2.2],
  [384, 30, 1.3, 0.5],
  [372, 60, 0.9, 1.8],
  [28, 72, 0.9, 2.6],
  [98, 84, 1.0, 1.4],
];

function Boca({ phase, personaje }) {
  if (phase === "failed") {
    return <path d="M2.5 -56.5 Q5.5 -59.5 8 -56.5" stroke={personaje.bocaFuerte} strokeWidth="1.2" strokeLinecap="round" fill="none" />;
  }
  if (phase === "celebrating" || phase === "inside") {
    return <path d="M2 -58.5 Q5 -54 8.5 -58.5 Z" fill={personaje.bocaFuerte} />;
  }
  return <path d="M3 -57.5 L7 -57.5" stroke={personaje.boca} strokeWidth="1" strokeLinecap="round" />;
}

// Peinado que va detrás de la cabeza (cola, pelo largo, rulos)
function PeloAtras({ personaje }) {
  const { estilo, pelo, cinta } = personaje;
  if (estilo === "cola") {
    return (
      <g>
        <path d="M-8 -67 C-19 -69 -20 -54 -14 -48 C-14 -55 -12 -60 -8 -62 Z" fill={pelo} />
        <circle cx="-8" cy="-64.5" r="1.6" fill={cinta || "#e8517a"} />
      </g>
    );
  }
  if (estilo === "largo") {
    return <path d="M-9 -66 C-16 -58 -15 -46 -9 -40 C-5 -39 0 -40 3 -41 C-1 -49 0 -57 4 -63 Z" fill={pelo} />;
  }
  if (estilo === "rulos") {
    return (
      <g fill={pelo}>
        <circle cx="-8" cy="-64" r="4" />
        <circle cx="-9" cy="-58" r="3.6" />
        <circle cx="-4" cy="-70" r="4.4" />
        <circle cx="3" cy="-72" r="4.4" />
        <circle cx="9" cy="-67" r="3.8" />
      </g>
    );
  }
  return null;
}

// Color y opacidad del enojo en la cara según el nivel
const ENOJO_CARA = {
  1: { fill: "#e5533d", opacity: 0.55 },
  2: { fill: "#d63a25", opacity: 0.8 },
  3: { fill: "#b32218", opacity: 0.95 },
  4: { fill: "#9a1d14", opacity: 0.97 },
  5: { fill: "#6b0f0a", opacity: 0.98 },
  6: { fill: "#8f1810", opacity: 0.97 },
  7: { fill: "#9a1d14", opacity: 0.9 },
  8: { fill: "#b32218", opacity: 0.95 },
};

// Rayos del sol (de día)
const RAYOS_SOL = Array.from({ length: 12 }, (_, i) => {
  const a = (i * 30 * Math.PI) / 180;
  return [292 + Math.cos(a) * 15, 26 + Math.sin(a) * 15, 292 + Math.cos(a) * 21, 26 + Math.sin(a) * 21];
});

export default function LoginScene({
  phase = "idle",
  variant = "panel",
  rage = 1,
  dialogo = null,
  dispositivo = "notebook",
  personaje = PERSONAJES[0],
  dia = false,
}) {
  const enojado = phase === "failed";
  const nivel = Math.min(Math.max(rage, 1), 8);
  const cara = ENOJO_CARA[nivel];
  // Qué efectos lleva cada nivel de enojo
  const conTormenta = enojado && ((nivel >= 3 && nivel <= 5) || nivel === 7);
  const conDispositivo = enojado && (nivel === 4 || nivel === 5);
  const conFuego = enojado && nivel === 5;
  const conRelampagos = enojado && (nivel === 4 || nivel === 5 || nivel === 7);

  return (
    <div
      className={`login-scene login-scene--${variant}`}
      data-phase={phase}
      data-rage={nivel}
      data-time={dia ? "day" : "night"}
      data-still={dialogo?.estatico ? "true" : "false"}
      aria-hidden="true"
    >
      <svg className="login-scene__svg" viewBox="0 0 400 170" focusable="false">
        {dia ? (
          <>
            {/* Sol */}
            <circle cx="292" cy="26" r="26" fill="rgba(255,236,150,0.3)" />
            <g className="login-scene__sun-rays" stroke="#ffd23f" strokeWidth="2" strokeLinecap="round">
              {RAYOS_SOL.map(([x1, y1, x2, y2], i) => (
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />
              ))}
            </g>
            <circle cx="292" cy="26" r="11" fill="#ffd23f" />

            {/* Pájaros */}
            <g transform="translate(0 44)">
              <g className="login-scene__bird">
                <path className="login-scene__wings" d="M0 0 Q3 -4 6 0 Q9 -4 12 0" fill="none" stroke="#2a3a5c" strokeWidth="1.3" strokeLinecap="round" />
              </g>
            </g>
            <g transform="translate(0 62)">
              <g className="login-scene__bird login-scene__bird--b">
                <path className="login-scene__wings" d="M0 0 Q3 -4 6 0 Q9 -4 12 0" fill="none" stroke="#2a3a5c" strokeWidth="1.3" strokeLinecap="round" />
              </g>
            </g>
          </>
        ) : (
          <>
            {/* Estrellas */}
            {ESTRELLAS.map(([x, y, r, demora]) => (
              <circle
                key={`${x}-${y}`}
                className="login-scene__star"
                cx={x}
                cy={y}
                r={r}
                style={{ animationDelay: `${demora}s` }}
              />
            ))}

            {/* Luna */}
            <circle cx="292" cy="26" r="22" fill="rgba(255,245,200,0.09)" />
            <circle cx="292" cy="26" r="10" fill="#f7f1d6" />
            <circle cx="289" cy="23" r="2.2" fill="rgba(120,110,70,0.18)" />
            <circle cx="296" cy="30" r="1.6" fill="rgba(120,110,70,0.18)" />
            <circle cx="295" cy="21" r="1.2" fill="rgba(120,110,70,0.18)" />
          </>
        )}

        {/* Nubes */}
        <g transform="translate(0 30)">
          <g className="login-scene__cloud login-scene__cloud--a">
            <ellipse cx="0" cy="0" rx="24" ry="7" />
            <ellipse cx="-12" cy="-5" rx="11" ry="8" />
            <ellipse cx="8" cy="-7" rx="13" ry="9" />
          </g>
        </g>
        <g transform="translate(0 58)">
          <g className="login-scene__cloud login-scene__cloud--b">
            <ellipse cx="0" cy="0" rx="18" ry="5.5" />
            <ellipse cx="-8" cy="-4" rx="8" ry="6" />
            <ellipse cx="6" cy="-5" rx="10" ry="7" />
          </g>
        </g>

        {/* Piso */}
        <rect className="login-scene__suelo" x="0" y="140" width="400" height="30" fill="rgba(0,0,0,0.35)" />
        <line className="login-scene__suelo-linea" x1="0" y1="140" x2="400" y2="140" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />

        {/* Farol: de noche, con cono de luz sobre el camino */}
        <polygon className="login-scene__farol-luz" points="176,86 144,140 208,140" fill="rgba(255,214,130,0.13)" />
        <circle className="login-scene__farol-luz" cx="176" cy="84" r="15" fill="rgba(255,214,130,0.2)" />
        <rect className="login-scene__poste" x="174.5" y="88" width="3" height="52" fill="#101830" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" />
        <path className="login-scene__poste" d="M169 86 Q176 77 183 86 Z" fill="#101830" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" />
        <circle className="login-scene__foco" cx="176" cy="87" r="2.6" fill="#ffe3a0" />

        {/* Facultad: de noche con ventanas y puerta iluminadas */}
        <g className="login-scene__faculty">
          <rect className="login-scene__b-escalon1" x="276" y="132" width="96" height="8" fill="#22325a" />
          <rect className="login-scene__b-escalon2" x="282" y="126" width="84" height="6" fill="#2b3d68" />
          <rect className="login-scene__b-cuerpo" x="286" y="68" width="76" height="58" fill="#26375f" />
          <polygon className="login-scene__b-frontis" points="280,68 324,40 368,68" fill="#31457a" />
          <text
            className="login-scene__b-texto"
            x="324"
            y="63"
            textAnchor="middle"
            fontSize="10"
            fontWeight="700"
            fill="#cfe0ff"
            fontFamily="Georgia, serif"
          >
            UTN
          </text>
          <rect className="login-scene__b-columna" x="290" y="68" width="6" height="58" fill="#3d548c" />
          <rect className="login-scene__b-columna" x="352" y="68" width="6" height="58" fill="#3d548c" />
          <rect className="login-scene__window" x="299" y="76" width="10" height="10" fill="#ffd27a" />
          <rect className="login-scene__window login-scene__window--b" x="339" y="76" width="10" height="10" fill="#ffd27a" />
          {/* Puerta: interior + hoja que se abre */}
          <rect className="login-scene__puerta-int" x="312" y="92" width="24" height="34" fill="#ffd27a" />
          <rect className="login-scene__door-leaf" x="312" y="92" width="24" height="34" fill="#9a6a2b" />
        </g>

        {/* Estudiante: el origen (0,0) son los pies */}
        <g transform="translate(48 140)">
          <g className="login-scene__walker">
            <ellipse className="login-scene__sombra" cx="0" cy="0.5" rx="14" ry="2.6" fill="rgba(0,0,0,0.4)" />
            <g transform={enojado ? "scale(-1 1)" : undefined}>
              <g className="login-scene__person">
                {/* Piernas */}
                <g className="login-scene__leg login-scene__leg--b">
                  <rect x="-3.5" y="-28" width="7" height="22" rx="3.5" fill={personaje.piernaAtras} />
                  <rect x="-4" y="-8" width="11" height="7" rx="3.5" fill="#dfe6ef" />
                </g>
                <g className="login-scene__leg login-scene__leg--a">
                  <rect x="-3.5" y="-28" width="7" height="22" rx="3.5" fill={personaje.piernaFrente} />
                  <rect x="-4" y="-8" width="11" height="7" rx="3.5" fill="#ffffff" />
                </g>

                {/* Torso, cabeza, mochila y brazos (suben y bajan al caminar) */}
                {personaje.falda && (
                  <path d="M-10 -29 L10 -29 L14 -14 L-14 -14 Z" fill={personaje.falda} stroke="rgba(0,0,0,0.15)" strokeWidth="0.6" />
                )}

                <g className="login-scene__bob">
                  <g className="login-scene__arm login-scene__arm--b">
                    <rect x="-3" y="-50" width="6" height="19" rx="3" fill={personaje.mangaAtras} />
                    <circle cx="0" cy="-30" r="3" fill={personaje.piel} />
                  </g>
                  <g className="login-scene__pack">
                    <rect x="-19" y="-50" width="12" height="22" rx="5" fill={personaje.mochila} />
                    <rect x="-19" y="-41" width="12" height="2.5" fill="rgba(0,0,0,0.18)" />
                  </g>
                  <rect x="-9" y="-52" width="18" height="26" rx="7" fill={personaje.remera} />
                  <path className="login-scene__strap" d="M-4 -51 L-8 -34" stroke={personaje.mochila} strokeWidth="2.5" strokeLinecap="round" />

                  <PeloAtras personaje={personaje} />

                  {/* Cabeza */}
                  <circle cx="1" cy="-62" r="9" fill={personaje.piel} />
                  {enojado && <circle cx="1" cy="-62" r="9" fill={cara.fill} opacity={cara.opacity} />}
                  <path
                    d="M-9.5 -61 C-10 -73 8 -75 10 -64 C5 -67 -3 -66 -9.5 -61 Z"
                    fill={personaje.pelo}
                  />
                  <circle cx="5" cy="-62" r="1.2" fill="#14181d" />
                  {enojado && (
                    <path
                      d="M1.5 -66.5 L8.5 -64"
                      stroke={personaje.pelo}
                      strokeWidth={nivel >= 2 ? 2.4 : 1.6}
                      strokeLinecap="round"
                    />
                  )}
                  <Boca phase={phase} personaje={personaje} />

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
                  {/* Nivel 5: fuego en la cabeza */}
                  {conFuego && (
                    <g className="login-scene__fire">
                      <path
                        d="M-6.5 -71 C-10 -77 -5 -80 -4.5 -86 C-1.5 -82 0.5 -80 -0.5 -75 C1.5 -78 4 -80 5 -85 C8.5 -80 8.5 -74 6.5 -71 Z"
                        fill="#ff7a1a"
                      />
                      <path d="M-3 -71 C-5 -75 -2 -77 -1.5 -80 C0 -78 1.5 -76 0.5 -73 C2 -75 3.5 -76 4 -72 Z" fill="#ffd84a" />
                    </g>
                  )}

                  {/* Niveles 3 a 5 y 7: tormenta con rayos sobre la cabeza */}
                  {conTormenta && (
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

                  {/* Nivel 7: le cae un rayo (pelo parado y ojos de "x" después del golpe) */}
                  {enojado && nivel === 7 && (
                    <>
                      <polygon className="login-scene__bolt-big" points="4,-88 -4,-72 0,-72 -6,-56 6,-70 1,-70 7,-88" />
                      <path
                        className="login-scene__frizz"
                        d="M-6 -70 L-9 -79 L-3 -73 L-2 -82 L1 -74 L4 -82 L5 -73 L9 -78 L7 -68 Z"
                        fill={personaje.pelo}
                      />
                      <path
                        className="login-scene__xeyes"
                        d="M3.4 -63.6 L6.6 -60.4 M6.6 -63.6 L3.4 -60.4"
                        stroke="#f4f4f4"
                        strokeWidth="1.1"
                        strokeLinecap="round"
                      />
                    </>
                  )}

                  <g className="login-scene__arm login-scene__arm--a">
                    <rect
                      x="-3"
                      y="-50"
                      width="6"
                      height="19"
                      rx="3"
                      fill={personaje.remera}
                      stroke="rgba(0,0,0,0.18)"
                      strokeWidth="0.8"
                    />
                    <circle cx="0" cy="-30" r="3" fill={personaje.piel} />
                  </g>
                </g>
              </g>
            </g>

            {/* Nivel 6: polvo que levanta al patalear en el piso */}
            {enojado && nivel === 6 && (
              <g>
                {[0, 1, 2].map((i) => (
                  <circle
                    key={i}
                    className="login-scene__dust-puff"
                    cx={-4 + i * 9}
                    cy="-3"
                    r="3"
                    style={{ animationDelay: `calc(var(--shake-delay) + ${0.4 + i * 0.22}s)` }}
                  />
                ))}
              </g>
            )}

            {/* Nivel 8: un OVNI lo abduce con su rayo tractor */}
            {enojado && nivel === 8 && (
              <g className="login-scene__ufo">
                <polygon className="login-scene__beam" points="-9,-84 9,-84 28,0 -28,0" />
                <ellipse cx="0" cy="-90" rx="23" ry="6" fill="#aab6d1" stroke="#7f8cab" strokeWidth="0.8" />
                <path d="M-11 -92 Q0 -108 11 -92 Z" fill="#bfe6ff" opacity="0.9" />
                <circle className="login-scene__ufo-light" cx="-14" cy="-89" r="1.6" />
                <circle className="login-scene__ufo-light login-scene__ufo-light--b" cx="0" cy="-87.5" r="1.6" />
                <circle className="login-scene__ufo-light" cx="14" cy="-89" r="1.6" />
              </g>
            )}

            {/* Niveles 4 y 5: tira su celular / notebook contra la facultad */}
            {conDispositivo && (
              <g className="login-scene__thrown">
                {/* La mano del estudiante está a 34 unidades sobre los pies */}
                <g transform="translate(0 -34)">
                  <g className="login-scene__device">
                    {dispositivo === "movil" ? (
                      <>
                        <rect x="-4" y="-7" width="8" height="14" rx="1.6" fill="#1a1f2b" stroke="#aab4c8" strokeWidth="0.8" />
                        <rect x="-3" y="-5.5" width="6" height="10" rx="0.8" fill="#6fc3ff" />
                      </>
                    ) : (
                      <>
                        <rect x="-9" y="-7" width="18" height="11" rx="1" fill="#1a1f2b" stroke="#aab4c8" strokeWidth="0.8" />
                        <rect x="-7.5" y="-5.5" width="15" height="8" fill="#6fc3ff" />
                        <path d="M-11 4.5 L11 4.5 L9 7 L-9 7 Z" fill="#aab4c8" />
                      </>
                    )}
                  </g>
                </g>
              </g>
            )}
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

      {/* Relámpagos que iluminan el cielo (niveles 4, 5 y 7) */}
      {conRelampagos && <div className="login-scene__flash" />}

      {/* Globo de diálogo: dice qué salió mal cuando falla el login */}
      {enojado && dialogo && (
        <div
          key={dialogo.id}
          className="login-scene__bubble"
          style={{ "--bubble-delay": `${dialogo.demora}s` }}
        >
          {dialogo.grito && <strong>{dialogo.grito} </strong>}
          {dialogo.texto}
        </div>
      )}
    </div>
  );
}