import { useEffect, useState } from "react";
import { getErrorMessage } from "../../shared/api/api";
import { getStudentSummary } from "./services/studentSummaryService";
import ProfileCard from "./components/ProfileCard";
import StatsRow from "./components/StatsRow";
import CourseList from "./components/CourseList";
import UpcomingEvents from "./components/UpcomingEvents";
import "../users/usersPage.css";
import "./studentDashboardPage.css";

export default function StudentDashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
            <UpcomingEvents events={summary.upcomingEvents} />
          </div>
        </>
      )}
    </div>
  );
}
