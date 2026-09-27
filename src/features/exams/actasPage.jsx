import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getErrorMessage } from "../../shared/api/api";
import { formatDateTime, isPast } from "../../shared/utils/formatters";
import ConfirmModal, { DELETE_NOTE } from "../../shared/ui/ConfirmModal";
import { getMyTeacherProfile } from "../users/services/teacherService";
import { getExamBoards, createExamBoard, closeExamBoard, deleteExamBoard } from "./services/examBoardService";
import { getExamEnrollments, updateExamEnrollment } from "./services/examEnrollmentService";
import ActaDetail from "./components/ActaDetail";
import GradeModal from "./components/GradeModal";
import CloseActaModal from "./components/CloseActaModal";
import ExamBoardFormModal from "./components/ExamBoardFormModal";
import "../users/usersPage.css";
import "../plans/plansPage.css";
import "../enrollments/portalCursadasPage.css";

const FILTERS = [
  { key: "abiertas", label: "Actas abiertas" },
  { key: "cerradas", label: "Actas cerradas" },
  { key: "todas", label: "Todas" },
];

// Quién puede qué (espeja el backend): Administrador y Bedel programan mesas;
// cargan notas el Administrador y el docente presidente de la mesa (por eso el
// Docente solo ve las mesas que preside); Bedel puede cerrar pero no calificar.
const ROLES_THAT_MANAGE_BOARDS = ["Administrador", "Bedel"];
const ROLES_THAT_GRADE = ["Administrador", "Docente"];

export default function ActasPage() {
  const { user } = useAuth();
  const role = user?.role;
  const canManageBoards = ROLES_THAT_MANAGE_BOARDS.includes(role);
  const canGrade = ROLES_THAT_GRADE.includes(role);

  const [boards, setBoards] = useState([]);
  const [filter, setFilter] = useState(FILTERS[0].key);
  const [selectedBoardId, setSelectedBoardId] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [loadingBoards, setLoadingBoards] = useState(true);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);
  const [error, setError] = useState("");

  const [enrollmentToGrade, setEnrollmentToGrade] = useState(null);
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [boardToDelete, setBoardToDelete] = useState(null);

  const reloadBoards = useCallback(async () => {
    setLoadingBoards(true);
    setError("");
    try {
      let data = await getExamBoards();
      if (role === "Docente") {
        const me = await getMyTeacherProfile();
        data = data.filter((b) => b.chairTeacherId === me.id);
      }
      setBoards(data.sort((a, b) => String(b.scheduledAt).localeCompare(String(a.scheduledAt))));
    } catch (e) {
      setError(getErrorMessage(e, "No pudimos cargar las mesas de examen."));
    } finally {
      setLoadingBoards(false);
    }
  }, [role]);

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
    if (filter === "abiertas") return !b.closed;
    if (filter === "cerradas") return b.closed;
    return true;
  });

  const selectedBoard = boards.find((b) => b.id === selectedBoardId) ?? null;

  async function handleGradeSubmit(data) {
    await updateExamEnrollment(enrollmentToGrade.id, data);
    setEnrollmentToGrade(null);
    await reloadEnrollments(selectedBoardId);
  }

  async function handleCloseActa(form) {
    await closeExamBoard(selectedBoard.id, form);
    setCloseModalOpen(false);
    await reloadBoards();
  }

  async function handleCreateBoard(data) {
    const created = await createExamBoard(data);
    setFormOpen(false);
    setFilter("abiertas");
    await reloadBoards();
    setSelectedBoardId(created.id);
  }

  async function handleConfirmDelete() {
    // Si falla, el error se propaga al ConfirmModal, que queda abierto y lo muestra.
    const board = boardToDelete;
    await deleteExamBoard(board.id);
    setBoardToDelete(null);
    if (board.id === selectedBoardId) setSelectedBoardId(null);
    await reloadBoards();
  }

  return (
    <div className="users-page">
      <div className="users-header">
        <div>
          <h1 className="users-title">Actas de examen</h1>
          <p className="users-subtitle">
            {role === "Docente"
              ? "Cargá las notas de las mesas que presidís y cerrá el acta con su libro y folio"
              : "Programá las mesas, controlá la carga de notas y cerrá el acta con su libro y folio"}
          </p>
        </div>
        {canManageBoards && (
          <div className="users-header-actions">
            <button type="button" className="users-btn users-btn--primary" onClick={() => setFormOpen(true)}>
              + Nueva mesa
            </button>
          </div>
        )}
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
                <span className={`users-badge ${board.closed ? "users-badge--gray" : "users-badge--navy"}`}>
                  {board.closed ? "Cerrada" : isPast(board.scheduledAt) ? "Pendiente de cierre" : "Programada"}
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
                closed={selectedBoard.closed}
                canGrade={canGrade}
                onGrade={setEnrollmentToGrade}
                onCloseActa={() => setCloseModalOpen(true)}
                onDeleteBoard={canManageBoards ? () => setBoardToDelete(selectedBoard) : null}
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

      <ExamBoardFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleCreateBoard}
      />

      <ConfirmModal
        open={!!boardToDelete}
        title="Eliminar mesa"
        note={DELETE_NOTE}
        message={boardToDelete ? `¿Seguro que querés eliminar la mesa de "${boardToDelete.courseName}"? Esta acción no se puede deshacer.` : ""}
        onCancel={() => setBoardToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
