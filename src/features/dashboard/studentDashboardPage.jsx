import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Notice from "../../shared/ui/Notice";
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
import LoadError from "../../shared/ui/LoadError";
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

  const [reloadKey, setReloadKey] = useState(0);
  const retry = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
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
  }, [reloadKey]);

  return (
    <div className="dash-page">
      {loading && <p className="users-empty">Cargando...</p>}
      <LoadError message={error} onRetry={retry} />

      {summary && (
        <>
          <ProfileCard profile={summary.profile} />
          {summary.stats.lostRegularities > 0 && (
            <Notice>
              {summary.stats.lostRegularities === 1
                ? "Perdiste la regularidad de una materia. "
                : `Perdiste la regularidad de ${summary.stats.lostRegularities} materias. `}
              <Link to="/historial">Ver el detalle en tu historial académico</Link>
            </Notice>
          )}
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
