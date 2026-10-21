// Escena animada del login: un estudiante con mochila camina hacia la facultad.
// Se controla solo con la prop `phase`:
//   "idle"     -> parado, respirando
//   "walking"  -> camina mientras se espera la respuesta del servidor
//   "entering" -> login correcto: corre a la puerta, la puerta se abre y entra
//   "failed"   -> login incorrecto: se da vuelta y vuelve al inicio
// Todo el movimiento está en loginScene.css (SVG + CSS, sin librerías).
import "./LoginScene.css";

const SKIN = "#f1c9a5";

export default function LoginScene({ phase = "idle", variant = "panel" }) {
  return (
    <div className={`login-scene login-scene--${variant}`} data-phase={phase} aria-hidden="true">
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
            <g transform={phase === "failed" ? "scale(-1 1)" : undefined}>
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
                  <circle cx="1" cy="-62" r="9" fill={SKIN} />
                  <path
                    d="M-9.5 -61 C-10 -73 8 -75 10 -64 C5 -67 -3 -66 -9.5 -61 Z"
                    fill="#2b2118"
                  />
                  <circle cx="5" cy="-62" r="1.2" fill="#14181d" />
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
      </svg>
    </div>
  );
}