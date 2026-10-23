// Personajes del estudiante de la animación del login.
// Cada uno define sus colores y su peinado; LoginScene los dibuja.
// estilo del pelo: "corto" | "cola" | "largo" | "rulos"
// `falda` (opcional): si está, lleva pollera y las piernas usan el color de piel.

export const PERSONAJES = [
  {
    id: "el-corto",
    piel: "#f1c9a5",
    pelo: "#2b2118",
    estilo: "corto",
    remera: "#ffffff",
    mangaAtras: "#cfd8e6",
    piernaFrente: "#8fb0dc",
    piernaAtras: "#6d8fbe",
    mochila: "#f2a900",
    boca: "#8a5a44",
    bocaFuerte: "#8a3f2a",
  },
  {
    id: "ella-cola",
    piel: "#e8b48a",
    pelo: "#5a3216",
    estilo: "cola",
    cinta: "#ff6f9c",
    remera: "#ffe3ee",
    mangaAtras: "#e6bfd0",
    piernaFrente: "#7f8fe0",
    piernaAtras: "#6272c4",
    mochila: "#8e5be0",
    boca: "#c05a73",
    bocaFuerte: "#a63a52",
  },
  {
    id: "ella-larga-pollera",
    piel: "#c98f63",
    pelo: "#1d1410",
    estilo: "largo",
    remera: "#ffffff",
    mangaAtras: "#cfd8e6",
    falda: "#e8517a",
    piernaFrente: "#c98f63",
    piernaAtras: "#b57d52",
    mochila: "#2fb7a3",
    boca: "#c05a73",
    bocaFuerte: "#a63a52",
  },
  {
    id: "el-rulos",
    piel: "#8c5a3a",
    pelo: "#1a110b",
    estilo: "rulos",
    remera: "#dff0ff",
    mangaAtras: "#b7cbe0",
    piernaFrente: "#8fb0dc",
    piernaAtras: "#6d8fbe",
    mochila: "#f2a900",
    boca: "#4a2a1a",
    bocaFuerte: "#3a1c10",
  },
  {
    id: "ella-rulos",
    piel: "#a8714a",
    pelo: "#24150d",
    estilo: "rulos",
    remera: "#fff4c9",
    mangaAtras: "#e0d4a2",
    piernaFrente: "#6fb7a8",
    piernaAtras: "#559a8c",
    mochila: "#e8517a",
    boca: "#b0485f",
    bocaFuerte: "#93344a",
  },
];

const CLAVE = "sysacad-login-personaje";

// Elige un personaje al azar, distinto del último que se vio en este navegador,
// así cada vez que se entra al login aparece alguien diferente.
export function elegirPersonaje() {
  let ultimo = null;
  try {
    ultimo = localStorage.getItem(CLAVE);
  } catch {
    // sin acceso al almacenamiento: no importa, se elige igual
  }
  const candidatos = PERSONAJES.filter((p) => p.id !== ultimo);
  const elegido = candidatos[Math.floor(Math.random() * candidatos.length)];
  try {
    localStorage.setItem(CLAVE, elegido.id);
  } catch {
    // idem
  }
  return elegido;
}