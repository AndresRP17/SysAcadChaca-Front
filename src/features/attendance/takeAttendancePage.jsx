import { useNavigate, useSearchParams, Link } from "react-router-dom";
import AttendanceSheet from "./AttendanceSheet";
import "../users/usersPage.css";
import "./takeAttendancePage.css";

// Ruta /asistencia?section=&date=: la misma hoja de asistencia que el modal del calendario,
// a pantalla completa (enlaces guardados). Al guardar vuelve al calendario.
export default function TakeAttendancePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  return (
    <div className="users-page">
      <Link to="/calendario" className="take-attendance-back">
        ← Calendario
      </Link>
      <AttendanceSheet
        sectionId={searchParams.get("section")}
        date={searchParams.get("date")}
        onSaved={() => navigate("/calendario")}
      />
    </div>
  );
}
