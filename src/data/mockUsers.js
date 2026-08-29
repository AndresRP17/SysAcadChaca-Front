let idCounter = 6;

export const mockUsers = [
  { id: 1, legajo: "45678", nombre: "Lucía", apellido: "Fernández", email: "lucia.fernandez@frsn.utn.edu.ar", rol: "Alumno", estado: "Activo" },
  { id: 2, legajo: "45120", nombre: "Martín", apellido: "Gómez", email: "martin.gomez@frsn.utn.edu.ar", rol: "Alumno", estado: "Activo" },
  { id: 3, legajo: "D-0231", nombre: "Silvina", apellido: "Torres", email: "storres@frsn.utn.edu.ar", rol: "Docente", estado: "Activo" },
  { id: 4, legajo: "44890", nombre: "Facundo", apellido: "Ríos", email: "facundo.rios@frsn.utn.edu.ar", rol: "Alumno", estado: "Inactivo" },
  { id: 5, legajo: "D-0187", nombre: "Ricardo", apellido: "Paz", email: "rpaz@frsn.utn.edu.ar", rol: "Docente", estado: "Activo" },
];

export function nextId() {
  idCounter += 1;
  return idCounter;
}
