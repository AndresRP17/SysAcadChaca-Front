// Titulo de cada pantalla: lo usa el topbar (visible) y document.title (pestana del navegador).
export const PAGE_TITLES = {
  usuarios: "Usuarios",
  alumnos: "Alumnos",
  planes: "Planes de estudio",
  cursadas: "Cursadas",
  alumno: "Vista alumno",
  historial: "Historial académico",
  certificados: "Certificados",
  auditoria: "Auditoría",
  "inscribir-alumno": "Inscribir alumno",
  "mis-cursadas": "Inscripción a cursadas",
  finales: "Inscripción a finales",
  actas: "Actas de examen",
  "mis-comisiones": "Mis comisiones",
  calendario: "Calendario",
  asistencia: "Asistencia",
  comision: "Comisión",
  perfil: "Mi perfil",
  "sin-acceso": "Sin acceso",
};

export function pageTitleFor(pathname) {
  const key = pathname.split("/")[1] || "";
  return PAGE_TITLES[key] || "SysAcad";
}
