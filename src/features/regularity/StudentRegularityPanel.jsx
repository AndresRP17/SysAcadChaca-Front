import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import LoadError from "../../shared/ui/LoadError";
import { getErrorCode, getErrorMessage } from "../../shared/api/api";
import { getRegularityRules, getStudentRegularity, revalidateRegularity } from "./services/regularityService";
import { REGULARITY_BADGE, regularityLabel, staffRegularityLines } from "./regularityStatus";
import RevalidateModal from "./RevalidateModal";

// Regularidades del alumno elegido (Bedelía / Administrador). Las perdidas se pueden revalidar si la
// institución lo permite. onChanged se llama tras revalidar para que la pantalla recargue la oferta.
export default function StudentRegularityPanel({ studentId, onChanged }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [allowRevalidation, setAllowRevalidation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [target, setTarget] = useState(null);

  const canRevalidate = allowRevalidation && (user?.role === "Bedel" || user?.role === "Administrador");

  const load = useCallback(async () => {
    setLoadError("");
    try {
      const [list, rules] = await Promise.all([getStudentRegularity({ studentId }), getRegularityRules()]);
      setItems(list);
      setAllowRevalidation(Boolean(rules.allowRevalidation));
    } catch (e) {
      setLoadError(getErrorMessage(e, "No pudimos cargar las regularidades del alumno."));
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    load();
  }, [load]);

  async function confirmRevalidate(reason) {
    try {
      await revalidateRegularity({ studentId, courseId: target.courseId, reason });
    } catch (e) {
      // La materia ya no estaba perdida (otra persona la revalidó): se actualiza la lista y el modal muestra por qué.
      if (getErrorCode(e) === "REGULARITY_NOT_LOST") await load();
      throw e;
    }
    setTarget(null);
    showToast("Regularidad revalidada.");
    await load();
    await onChanged?.();
  }

  return (
    <section className="portal-section" aria-labelledby="student-regularity-title">
      <h2 className="portal-section-title" id="student-regularity-title">Regularidades del alumno</h2>
      <LoadError message={loadError} onRetry={load} />
      {loading && <p className="users-empty">Cargando...</p>}
      {!loading && !loadError && items.length === 0 && (
        <p className="users-empty">Este alumno todavía no tiene materias regularizadas.</p>
      )}

      <div className="portal-cards">
        {items.map((item) => (
          <article key={item.courseId} className="portal-card">
            <div className="portal-card-head">
              <div className="portal-card-head-text">
                <h3 className="portal-card-title">{item.courseName}</h3>
                {staffRegularityLines(item).map((line) => (
                  <p key={line} className="portal-card-sub">{line}</p>
                ))}
              </div>
              <div className="portal-card-badges">
                <span className={`users-badge users-badge--${REGULARITY_BADGE[item.status] ?? "navy"}`}>
                  {regularityLabel(item.status)}
                </span>
              </div>
            </div>
            {item.status === "LOST" && canRevalidate && (
              <div className="portal-card-actions">
                <button type="button" className="users-btn users-btn--primary" onClick={() => setTarget(item)}>
                  Revalidar
                </button>
              </div>
            )}
          </article>
        ))}
      </div>

      <RevalidateModal open={target !== null} item={target} onClose={() => setTarget(null)} onConfirm={confirmRevalidate} />
    </section>
  );
}
