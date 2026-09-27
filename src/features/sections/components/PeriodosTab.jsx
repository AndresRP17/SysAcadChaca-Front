import { useCallback, useEffect, useState } from "react";
import { getErrorMessage } from "../../../shared/api/api";
import ConfirmModal, { DELETE_NOTE } from "../../../shared/ui/ConfirmModal";
import { todayIso } from "../../../shared/utils/formatters";
import EnrollmentPeriodFormModal from "./EnrollmentPeriodFormModal";
import {
  PERIOD_TYPES,
  getEnrollmentPeriods,
  createEnrollmentPeriod,
  updateEnrollmentPeriod,
  deleteEnrollmentPeriod,
} from "../services/enrollmentPeriodService";

function formatDate(isoDate) {
  const [y, m, d] = isoDate.split("-");
  return `${d}/${m}/${y}`;
}

function periodState(period) {
  const today = todayIso();
  if (!period.active) return { label: "Inactivo", variant: "users-badge--gray" };
  if (today < period.startDate) return { label: "Próximo", variant: "users-badge--navy" };
  if (today > period.endDate) return { label: "Vencido", variant: "users-badge--inactive" };
  return { label: "Abierto", variant: "users-badge--active" };
}

export default function PeriodosTab() {
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [editingPeriod, setEditingPeriod] = useState(null);
  const [periodToDelete, setPeriodToDelete] = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setPeriods(await getEnrollmentPeriods());
    } catch (e) {
      setError(getErrorMessage(e, "No pudimos cargar los períodos."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  function openCreateModal() {
    setFormMode("create");
    setEditingPeriod(null);
    setFormOpen(true);
  }

  function openEditModal(period) {
    setFormMode("edit");
    setEditingPeriod(period);
    setFormOpen(true);
  }

  async function handleFormSubmit(payload) {
    if (formMode === "edit" && editingPeriod) {
      await updateEnrollmentPeriod(editingPeriod.id, payload);
    } else {
      await createEnrollmentPeriod(payload);
    }
    setFormOpen(false);
    await reload();
  }

  async function handleConfirmDelete() {
    // Si falla, el error se propaga al ConfirmModal, que queda abierto y lo muestra.
    await deleteEnrollmentPeriod(periodToDelete.id);
    setPeriodToDelete(null);
    await reload();
  }

  return (
    <div>
      <div className="plans-toolbar">
        <p className="users-subtitle">
          Los alumnos solo pueden inscribirse dentro de un período abierto. Administrador y Bedel no tienen esa restricción.
        </p>
        <button type="button" className="users-btn users-btn--primary" onClick={openCreateModal}>
          + Nuevo período
        </button>
      </div>

      {error && <p className="users-form-error">{error}</p>}

      <div className="users-table-wrapper">
        <table className="users-table">
          <thead>
            <tr>
              <th className="users-th">Tipo</th>
              <th className="users-th">Año</th>
              <th className="users-th">Cuatrimestre</th>
              <th className="users-th">Desde</th>
              <th className="users-th">Hasta</th>
              <th className="users-th">Estado</th>
              <th className="users-th users-th--actions">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td className="users-empty" colSpan={7}>Cargando...</td></tr>
            )}
            {!loading && periods.length === 0 && (
              <tr><td className="users-empty" colSpan={7}>No hay períodos cargados: ningún alumno puede inscribirse hasta que abras uno.</td></tr>
            )}
            {periods.map((period) => {
              const state = periodState(period);
              return (
                <tr key={period.id} className="users-row">
                  <td className="users-td" data-label="Tipo">{PERIOD_TYPES[period.type] ?? period.type}</td>
                  <td className="users-td" data-label="Año">{period.academicYear}</td>
                  <td className="users-td" data-label="Cuatrimestre">{period.term ? `${period.term}°` : "Todos"}</td>
                  <td className="users-td" data-label="Desde">{formatDate(period.startDate)}</td>
                  <td className="users-td" data-label="Hasta">{formatDate(period.endDate)}</td>
                  <td className="users-td" data-label="Estado">
                    <span className={`users-badge ${state.variant}`}>{state.label}</span>
                  </td>
                  <td className="users-td users-td--actions" data-label="Acciones">
                    <button type="button" className="users-action-btn" onClick={() => openEditModal(period)}>
                      Editar
                    </button>
                    <button
                      type="button"
                      className="users-action-btn users-action-btn--danger"
                      onClick={() => setPeriodToDelete(period)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <EnrollmentPeriodFormModal
        open={formOpen}
        mode={formMode}
        initialData={editingPeriod}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      <ConfirmModal
        open={!!periodToDelete}
        title="Eliminar período"
        note={DELETE_NOTE}
        message={periodToDelete ? `¿Seguro que querés eliminar este período de ${PERIOD_TYPES[periodToDelete.type] ?? periodToDelete.type}? Esta acción no se puede deshacer.` : ""}
        onCancel={() => setPeriodToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
