// Mock de "Licenciatura en Administración de Empresas, plan 2010",
// basado en la pantalla real de SysAcad. Cuando exista el backend,
// esto se reemplaza por GET /subjects, GET /prerequisites y
// GET /students/:id/subject-status.

export const subjects = [
  { id: 1, name: "Administración I", year: 1, quarter: "1/2c" },
  { id: 2, name: "Administración de Operaciones I", year: 1, quarter: "1/2c" },
  { id: 3, name: "Administración Financiera I", year: 1, quarter: "1/2c" },
  { id: 4, name: "Cálculo Financiero", year: 1, quarter: "1/2c" },
  { id: 5, name: "Dirección de Recursos Humanos", year: 1, quarter: "1/2c" },
  { id: 6, name: "Marketing I", year: 1, quarter: "1/2c" },
  { id: 7, name: "Administración II", year: 2, quarter: "1/2c" },
  { id: 8, name: "Administración de Operaciones II", year: 2, quarter: "1/2c" },
  { id: 9, name: "Administración Estratégica", year: 2, quarter: "1/2c" },
  { id: 10, name: "Administración Financiera II", year: 2, quarter: "1/2c" },
  { id: 11, name: "Investigación Operativa", year: 2, quarter: "1/2c" },
  { id: 12, name: "Marketing II", year: 2, quarter: "1/2c" },
  { id: 13, name: "Metodología Básica de la Investigación", year: 2, quarter: "1/2c" },
  { id: 14, name: "Tesina", year: 2, quarter: "1/2c" },
];

// type: "cursar" | "rendir". requiredStatus: el estado que necesita
// tener la correlativa para habilitar esta regla (aprobada/regularizada).
export const prerequisites = [
  { id: 1, subjectId: 8, requiresSubjectId: 2, type: "cursar", requiredStatus: "regularizada", ordinance: "1261" },
  { id: 2, subjectId: 9, requiresSubjectId: 1, type: "cursar", requiredStatus: "regularizada", ordinance: "1261" },
  { id: 3, subjectId: 11, requiresSubjectId: 4, type: "cursar", requiredStatus: "regularizada", ordinance: "1261" },
  { id: 4, subjectId: 13, requiresSubjectId: 6, type: "cursar", requiredStatus: "regularizada", ordinance: "1261" },
  { id: 5, subjectId: 14, requiresSubjectId: 9, type: "rendir", requiredStatus: "aprobada", ordinance: "1261" },
  { id: 6, subjectId: 14, requiresSubjectId: 8, type: "rendir", requiredStatus: "aprobada", ordinance: "1261" },
  { id: 7, subjectId: 14, requiresSubjectId: 11, type: "rendir", requiredStatus: "aprobada", ordinance: "1261" },
  { id: 8, subjectId: 14, requiresSubjectId: 13, type: "rendir", requiredStatus: "aprobada", ordinance: "1261" },
];

// status: "aprobada" | "regularizada" | "pendiente"
export const studentSubjectStatus = [
  { subjectId: 1, status: "aprobada" },
  { subjectId: 2, status: "aprobada" },
  { subjectId: 3, status: "aprobada" },
  { subjectId: 4, status: "aprobada" },
  { subjectId: 5, status: "aprobada" },
  { subjectId: 6, status: "aprobada" },
  { subjectId: 7, status: "regularizada" },
  { subjectId: 8, status: "regularizada" },
  { subjectId: 9, status: "regularizada" },
  { subjectId: 10, status: "pendiente" },
  { subjectId: 11, status: "regularizada" },
  { subjectId: 12, status: "pendiente" },
  { subjectId: 13, status: "pendiente" },
  { subjectId: 14, status: "pendiente" },
];
