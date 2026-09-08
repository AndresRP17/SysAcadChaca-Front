export const studentData = {
  perfil: {
    nombre: "Andrés",
    apellido: "Pérez",
    legajo: "45678",
    carrera: "Tecnicatura en Programación",
    email: "andres.perez@frsn.utn.edu.ar",
  },
  stats: {
    promedio: 7.8,
    materiasAprobadas: 14,
    materiasEnCurso: 3,
  },
  materiasEnCurso: [
    { id: 1, nombre: "Base de Datos", docente: "Ing. Silvina Torres", estado: "Cursando" },
    { id: 2, nombre: "Programación III", docente: "Ing. Ricardo Paz", estado: "Cursando" },
    { id: 3, nombre: "Investigación Operativa", docente: "Lic. Marcos Díaz", estado: "Regularizada" },
  ],
  proximosEventos: [
    { id: 1, tipo: "Final", detalle: "Sistemas Operativos", fecha: "05/09/2026" },
    { id: 2, tipo: "Inscripción", detalle: "Apertura inscripción a finales", fecha: "10/09/2026" },
    { id: 3, tipo: "Parcial", detalle: "Base de Datos - 2do parcial", fecha: "18/09/2026" },
  ],
};
