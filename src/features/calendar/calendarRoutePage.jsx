import { useAuth } from "../../context/AuthContext";
import CalendarPage from "./calendarPage/calendarPage";
import StaffCalendarPage from "./staffCalendarPage";

// /calendario: el Docente ve sus clases (y toma asistencia) y el Alumno las suyas (solo lectura,
// con su asistencia); Bedel y Administrador ven el calendario de todas las comisiones, con
// filtros y gestion.
export default function CalendarRoutePage() {
  const { user } = useAuth();
  const isStaff = user?.role === "Administrador" || user?.role === "Bedel";
  return isStaff ? <StaffCalendarPage /> : <CalendarPage />;
}
