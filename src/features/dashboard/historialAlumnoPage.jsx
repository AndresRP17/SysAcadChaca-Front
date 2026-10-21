import { useCallback, useEffect, useState } from "react";
import { getErrorMessage } from "../../shared/api/api";
import { getStudentHistory } from "./services/studentHistoryService";
import ProfileCard from "./components/ProfileCard";
import HistoryProgress from "./components/HistoryProgress";
import HistoryCourseList from "./components/HistoryCourseList";
import HistoryExamList from "./components/HistoryExamList";
import LoadError from "../../shared/ui/LoadError";
import "../users/usersPage.css";
import "./studentDashboardPage.css";

export default function HistorialAlumnoPage() {
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [reloadKey, setReloadKey] = useState(0);
  const retry = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
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
  }, [reloadKey]);

  return (
    <div className="dash-page">
      {loading && <p className="users-empty">Cargando...</p>}
      <LoadError message={error} onRetry={retry} />

      {history && (
        <>
          <ProfileCard profile={history.profile} />
          <HistoryProgress progress={history.progress} />

          <div className="dash-grid">
            <HistoryCourseList courses={history.courses} regularities={history.regularities ?? []} />
            <HistoryExamList exams={history.exams} />
          </div>
        </>
      )}
    </div>
  );
}
