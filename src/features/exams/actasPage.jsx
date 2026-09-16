import { useCallback, useEffect, useState } from "react";
import { getErrorMessage } from "../../shared/api/api";
import { formatDateTime, isPast } from "../../shared/utils/formatters";
import { getExamBoards, updateExamBoard } from "./services/examBoardService";
import { getExamEnrollments, updateExamEnrollment } from "./services/examEnrollmentService";
import ActaDetail from "./components/ActaDetail";
import GradeModal from "./components/GradeModal";
import CloseActaModal from "./components/CloseActaModal";
import "../users/usersPage.css";
import "../plans/plansPage.css";
import "../enrollments/portalCursadasPage.css";

const FILTERS = [
  { key: "abiertas", label: "Actas abiertas" },
  { key: "cerradas", label: "Actas cerradas" },
  { key: "todas", label: "Todas" },
];

function isClosed(board) {
  return !!board.recordBook && !!board.recordFolio;
}

export default function ActasPage() {
  const [boards, setBoards] = useState([]);
  const [filter, setFilter] = useState(FILTERS[0].key);
  const [selectedBoardId, setSelectedBoardId] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [loadingBoards, setLoadingBoards] = useState(true);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);
  const [error, setError] = useState("");

  const [enrollmentToGrade, setEnrollmentToGrade] = useState(null);
  const [closeModalOpen, setCloseModalOpen] = useState(false);

  const reloadBoards = useCallback(async () => {
    setLoadingBoards(true);
    setError("");
    try {
      const data = await getExamBoards();
      setBoards(data.sort((a, b) => String(b.scheduledAt).localeCompare(String(a.scheduledAt))));
    } catch (e) {
      setError(getErrorMessage(e, "No pudimos cargar las mesas de examen."));
    } finally {
      setLoadingBoards(false);
    }
  }, []);

  useEffect(() => {
    reloadBoards();
  }, [reloadBoards]);

  const reloadEnrollments = useCallback(async (boardId) => {
    if (!boardId) {
      setEnrollments([]);
      return;
    }
    setLoadingEnrollments(true);
    try {
      setEnrollments(await getExamEnrollments({ examBoardId: boardId }));
    } catch (e) {
      setError(getErrorMessage(e, "No pudimos cargar los inscriptos de la mesa."));
    } finally {
      setLoadingEnrollments(false);
    }
  }, []);

  useEffect(() => {
    reloadEnrollments(selectedBoardId);
  }, [selectedBoardId, reloadEnrollments]);

  const visibleBoards = boards.filter((b) => {
    if (filter === "abiertas") return !isClosed(b);
    if (filter === "cerradas") return isClosed(b);
    return true;
  });

  const selectedBoard = boards.find((b) => b.id === selectedBoardId) ?? null;

  async function handleGradeSubmit(data) {
    await updateExamEnrollment(enrollmentToGrade.id, data);
    setEnrollmentToGrade(null);
    await reloadEnrollments(selectedBoardId);
  }

  async function handleCloseActa(form) {
    await updateExamBoard(selectedBoard.id, form);
    setCloseModalOpen(false);
    await reloadBoards();
  }

  return (
    <div className="users-page">
      <div className="users-header">
        <div>
          <h1 className="users-title">Actas de examen</h1>
          <p className="users-subtitle">Cargá las notas de cada mesa y cerrá el acta con su libro y folio</p>
        </div>
      </div>

      {error && <p className="users-form-error">{error}</p>}

      <div className="users-filter-bar">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            className={`users-filter-btn ${filter === f.key ? "users-filter-btn--active" : ""}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loadingBoards && <p className="users-empty">Cargando...</p>}

      {!loadingBoards && visibleBoards.length === 0 && (
        <p className="users-empty">No hay mesas para este filtro.</p>
      )}

      {!loadingBoards && visibleBoards.length > 0 && (
        <div className="portal-acta-layout">
          <div className="portal-acta-list">
            {visibleBoards.map((board) => (
              <button
                key={board.id}
                type="button"
                className={`portal-acta-btn ${board.id === selectedBoardId ? "portal-acta-btn--active" : ""}`}
                onClick={() => setSelectedBoardId(board.id)}
              >
                <span>{board.courseName}</span>
                <span className="portal-card-sub">{formatDateTime(board.scheduledAt)}</span>
                <span className={`users-badge ${isClosed(board) ? "users-badge--gray" : "users-badge--navy"}`}>
                  {isClosed(board) ? "Cerrada" : isPast(board.scheduledAt) ? "Pendiente de cierre" : "Programada"}
                </span>
              </button>
            ))}
          </div>

          <div>
            {!selectedBoard && (
              <p className="users-empty">Elegí una mesa de la izquierda para ver su acta.</p>
            )}

            {selectedBoard && (
              <ActaDetail
                board={selectedBoard}
                enrollments={enrollments}
                loading={loadingEnrollments}
                closed={isClosed(selectedBoard)}
                onGrade={setEnrollmentToGrade}
                onCloseActa={() => setCloseModalOpen(true)}
              />
            )}
          </div>
        </div>
      )}

      <GradeModal
        open={!!enrollmentToGrade}
        enrollment={enrollmentToGrade}
        onClose={() => setEnrollmentToGrade(null)}
        onSubmit={handleGradeSubmit}
      />

      <CloseActaModal
        open={closeModalOpen}
        board={selectedBoard}
        onClose={() => setCloseModalOpen(false)}
        onSubmit={handleCloseActa}
      />
    </div>
  );
}
