import { useEffect, useMemo, useState } from "react";
import { getErrorMessage } from "../../shared/api/api";
import { getStudentSummary } from "./services/studentSummaryService";
import { useStudentSections } from "../enrollments/hooks/useStudentSections";
import { useStudentExamBoards } from "../exams/hooks/useStudentExamBoards";
import { isPast } from "../../shared/utils/formatters";
import ProfileCard from "./components/ProfileCard";
import StatsRow from "./components/StatsRow";
import CourseList from "./components/CourseList";
import WeeklyAgenda from "./components/WeeklyAgenda";
import UpcomingExamBoards from "./components/UpcomingExamBoards";
import "../users/usersPage.css";
import "./studentDashboardPage.css";

export default function StudentDashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Agenda (cursadas + mesas, al estilo SIU-Guaraní): estos dos hooks ya
  // traen los horarios por comisión inscripta y las mesas de final del
  // alumno respectivamente, no hace falta un endpoint nuevo.
  const { enrolled: enrolledSections } = useStudentSections();
  const { enrolled: enrolledBoards } = useStudentExamBoards();

  const weekSchedules = useMemo(
    () => enrolledSections.flatMap((item) => item.schedules),
    [enrolledSections],
  );

  const upcomingBoards = useMemo(
    () => enrolledBoards.filter(({ board }) => !isPast(board.scheduledAt)),
    [enrolledBoards],
  );

  useEffect(() => {
    let cancelled = false;
    getStudentSummary()
      .then((data) => {
        if (!cancelled) setSummary(data);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err?.response?.status === 403
            ? "Esta vista es solo para alumnos."
            : getErrorMessage(err, "No se pudo cargar tu resumen académico.")
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="dash-page">
      {loading && <p className="users-empty">Cargando...</p>}
      {error && <p className="users-form-error">{error}</p>}

      {summary && (
        <>
          <ProfileCard profile={summary.profile} />
          <StatsRow stats={summary.stats} />

          <div className="dash-grid">
            <CourseList courses={summary.currentCourses} />
            <UpcomingExamBoards boards={upcomingBoards} />
          </div>

          <WeeklyAgenda schedules={weekSchedules} />
        </>
      )}
    </div>
  );
}
