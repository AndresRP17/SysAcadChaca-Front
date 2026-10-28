import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { formatDateTime, isPast } from "../../shared/utils/formatters";
import ConfirmModal, { DELETE_NOTE } from "../../shared/ui/ConfirmModal";
import ListFilters from "../../shared/ui/ListFilters/ListFilters";
import LoadError from "../../shared/ui/LoadError/LoadError";
import Pagination from "../../shared/ui/Pagination/Pagination";
import { getExamBoard, createExamBoard, closeExamBoard, deleteExamBoard, cancelExamBoard } from "./services/examBoardService";
import { updateExamEnrollment } from "./services/examEnrollmentService";
import { useExamBoards } from "./hooks/useExamBoards";
import { useBoardEnrollments } from "./hooks/useBoardEnrollments";
import ActaDetail from "./components/ActaDetail";
import GradeModal from "./components/GradeModal";
import CloseActaModal from "./components/CloseActaModal";
import CancelActaModal from "./components/CancelActaModal";
import ExamBoardFormModal from "./components/ExamBoardFormModal";
import "../users/usersPage/usersPage.css";
import "../plans/plansPage/plansPage.css";
import "../enrollments/portalCursadasPage/portalCursadasPage.css";

const STATUS_OPTIONS = [
  { value: "open", label: "Abiertas" },
  { value: "closed", label: "Cerradas" },
  { value: "cancelled", label: "Canceladas" },
];

// Quién puede qué (espeja el backend): Administrador y Bedel programan mesas;
// cargan notas y cierran el acta el Administrador y el docente presidente O
// vocal de la mesa (por eso el Docente solo ve las mesas donde participa,
// como presidente o como vocal); Bedel puede cerrar pero no calificar.
const ROLES_THAT_MANAGE_BOARDS = ["Administrador", "Bedel"];
const ROLES_THAT_GRADE = ["Administrador", "Docente"];

export default function ActasPage() {
  const { user } = useAuth();
  const role = user?.role;
  const canManageBoards = ROLES_THAT_MANAGE_BOARDS.includes(role);
  const canGrade = ROLES_THAT_GRADE.includes(role);
  const { showToast } = useToast();

  // El Docente solo ve las mesas donde participa (presidente o vocal): lo filtra el servidor.
  const list = useExamBoards({ mine: role === "Docente" });
  const { boards } = list;

  // La mesa elegida se guarda entera: puede no estar en la página visible (recién creada, otro filtro).
  const [selectedBoard, setSelectedBoard] = useState(null);
  const selectedBoardId = selectedBoard?.id ?? null;
  const enrollmentsList = useBoardEnrollments(selectedBoardId);

  const [enrollmentToGrade, setEnrollmentToGrade] = useState(null);
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [boardToDelete, setBoardToDelete] = useState(null);
  const [boardToCancel, setBoardToCancel] = useState(null);

  // Si la mesa elegida aparece en la página cargada, se toma su versión fresca (estado, inscriptos).
  useEffect(() => {
    setSelectedBoard((current) => {
      if (!current) return current;
      const fresh = boards.find((b) => b.id === current.id);
      return fresh ?? current;
    });
  }, [boards]);

  // Después de cerrar o cancelar: refresca la mesa elegida aunque no esté en la página visible.
  async function refreshSelectedBoard(id = selectedBoardId) {
    if (!id) return;
    try {
      setSelectedBoard(await getExamBoard(id));
    } catch {
      // la lista recargada igual la actualiza si está visible
    }
  }

  async function handleGradeSubmit(data) {
    await updateExamEnrollment(enrollmentToGrade.id, data);
    setEnrollmentToGrade(null);
    enrollmentsList.reload();
  }

  async function handleCloseActa(form) {
    await closeExamBoard(selectedBoard.id, form);
    setCloseModalOpen(false);
    list.reload();
    await refreshSelectedBoard();
    showToast("Acta cerrada correctamente");
  }

  async function handleCreateBoard(data) {
    const created = await createExamBoard(data);
    setFormOpen(false);
    list.showDefaultView();
    list.reload();
    setSelectedBoard(created);
    await refreshSelectedBoard(created.id);
  }

  async function handleConfirmDelete() {
    // Si falla, el error se propaga al ConfirmModal, que queda abierto y lo muestra.
    const board = boardToDelete;
    await deleteExamBoard(board.id);
    setBoardToDelete(null);
    if (board.id === selectedBoardId) setSelectedBoard(null);
    list.reload();
  }

  async function handleConfirmCancel(reason) {
    // Si falla, el error se propaga al CancelActaModal, que queda abierto y lo muestra.
    await cancelExamBoard(boardToCancel.id, reason);
    setBoardToCancel(null);
    list.reload();
    await refreshSelectedBoard();
    showToast("Mesa cancelada: se rechazaron sus inscripciones");
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

      <ListFilters
        idPrefix="actas"
        search={list.filters.search}
        onSearchChange={(value) => list.changeFilter("search", value)}
        searchLabel="Buscar materia"
        searchPlaceholder="Nombre o código de la materia"
        selects={[
          {
            id: "status",
            label: "Estado",
            value: list.filters.status,
            onChange: (value) => list.changeFilter("status", value),
            options: STATUS_OPTIONS,
            allLabel: "Todas",
          },
        ]}
        hasFilters={list.hasFilters}
        onClear={list.clearFilters}
      >
        <div className="users-form-field">
          <label className="users-form-label" htmlFor="actas-from">Desde</label>
          <input
            id="actas-from"
            type="date"
            className="users-form-input"
            value={list.filters.from}
            max={list.filters.to || undefined}
            onChange={(e) => list.changeFilter("from", e.target.value)}
          />
        </div>
        <div className="users-form-field">
          <label className="users-form-label" htmlFor="actas-to">Hasta</label>
          <input
            id="actas-to"
            type="date"
            className="users-form-input"
            value={list.filters.to}
            min={list.filters.from || undefined}
            onChange={(e) => list.changeFilter("to", e.target.value)}
          />
        </div>
      </ListFilters>

      <LoadError message={list.error} onRetry={list.reload} />

      {list.loading && boards.length === 0 && !list.error && <p className="users-empty">Cargando...</p>}

      {!list.loading && !list.error && boards.length === 0 && (
        <p className="users-empty">
          {list.hasFilters ? "No hay mesas con esos filtros." : "No hay mesas para mostrar."}
        </p>
      )}

      {!list.error && boards.length > 0 && (
        <div className="portal-acta-layout">
          <div className={"users-list" + (list.loading ? " users-list--loading" : "")} aria-busy={list.loading}>
            <div className="portal-acta-list">
              {boards.map((board) => (
                <button
                  key={board.id}
                  type="button"
                  className={`portal-acta-btn ${board.id === selectedBoardId ? "portal-acta-btn--active" : ""}`}
                  onClick={() => setSelectedBoard(board)}
                >
                  <span>{board.courseName}</span>
                  <span className="portal-card-sub">{formatDateTime(board.scheduledAt)}</span>
                  <span
                    className={`users-badge ${
                      board.cancelled ? "users-badge--inactive" : board.closed ? "users-badge--gray" : "users-badge--navy"
                    }`}
                  >
                    {board.cancelled
                      ? "Cancelada"
                      : board.closed
                      ? "Cerrada"
                      : isPast(board.scheduledAt)
                      ? "Pendiente de cierre"
                      : "Programada"}
                  </span>
                </button>
              ))}
            </div>
            <Pagination
              page={list.page}
              pageSize={list.pageSize}
              total={list.total}
              onPageChange={list.setPage}
              onPageSizeChange={list.changePageSize}
              noun={["mesa", "mesas"]}
            />
          </div>

          <div>
            {!selectedBoard && (
              <p className="users-empty">Elegí una mesa de la izquierda para ver su acta.</p>
            )}

            {selectedBoard && (
              <ActaDetail
                board={selectedBoard}
                list={enrollmentsList}
                closed={selectedBoard.closed}
                canGrade={canGrade}
                onGrade={setEnrollmentToGrade}
                onCloseActa={() => setCloseModalOpen(true)}
                onDeleteBoard={canManageBoards ? () => setBoardToDelete(selectedBoard) : null}
                onCancelBoard={canManageBoards ? () => setBoardToCancel(selectedBoard) : null}
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

      <CancelActaModal
        open={!!boardToCancel}
        board={boardToCancel}
        onClose={() => setBoardToCancel(null)}
        onSubmit={handleConfirmCancel}
      />
    </div>
  );
}
