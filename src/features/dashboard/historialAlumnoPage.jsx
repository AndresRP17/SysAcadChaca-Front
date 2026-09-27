import { useEffect, useState } from "react";
import { getErrorMessage } from "../../shared/api/api";
import { getStudentHistory } from "./services/studentHistoryService";
import ProfileCard from "./components/ProfileCard";
import HistoryProgress from "./components/HistoryProgress";
import HistoryCourseList from "./components/HistoryCourseList";
import HistoryExamList from "./components/HistoryExamList";
import "../users/usersPage.css";
import "./studentDashboardPage.css";

export default function HistorialAlumnoPage() {
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getStudentHistory()
      .then((data) => {
        if (!cancelled) setHistory(data);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err?.response?.status === 403
            ? "Esta vista es solo para alumnos."
            : getErrorMessage(err, "No se pudo cargar tu historial académico.")
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

      {history && (
        <>
          <ProfileCard profile={history.profile} />
          <HistoryProgress progress={history.progress} />

          <div className="dash-grid">
            <HistoryCourseList courses={history.courses} />
            <HistoryExamList exams={history.exams} />
          </div>
        </>
      )}
    </div>
  );
}
