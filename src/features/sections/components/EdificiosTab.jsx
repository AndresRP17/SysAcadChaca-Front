import { useState } from "react";
import { useBuildings } from "../hooks/useBuildings";
import BuildingFormModal from "./BuildingFormModal";
import ConfirmModal from "../../../shared/ui/ConfirmModal";

export default function EdificiosTab() {
  const { buildings, loading, error, addBuilding, editBuilding, removeBuilding } = useBuildings();

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [editingBuilding, setEditingBuilding] = useState(null);
  const [buildingToDelete, setBuildingToDelete] = useState(null);

  function openCreateModal() {
    setFormMode("create");
    setEditingBuilding(null);
    setFormOpen(true);
  }

  function openEditModal(building) {
    setFormMode("edit");
    setEditingBuilding(building);
    setFormOpen(true);
  }

  async function handleFormSubmit(data) {
    if (formMode === "edit" && editingBuilding) {
      await editBuilding(editingBuilding.id, data);
    } else {
      await addBuilding(data);
    }
    setFormOpen(false);
  }

  async function handleConfirmDelete() {
    await removeBuilding(buildingToDelete.id);
    setBuildingToDelete(null);
  }

  return (
    <div>
      <div className="plans-toolbar">
        <p className="users-subtitle">{buildings.length} edificio{buildings.length !== 1 ? "s" : ""}</p>
        <button type="button" className="users-btn users-btn--primary" onClick={openCreateModal}>
          + Nuevo edificio
        </button>
      </div>

      {error && <p className="users-form-error">{error}</p>}

      <div className="users-table-wrapper">
        <table className="users-table">
          <thead>
            <tr>
              <th className="users-th">Nombre</th>
              <th className="users-th">Dirección</th>
              <th className="users-th users-th--actions">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td className="users-empty" colSpan={3}>Cargando...</td></tr>
            )}
            {!loading && buildings.length === 0 && (
              <tr><td className="users-empty" colSpan={3}>No hay edificios cargados.</td></tr>
            )}
            {!loading && buildings.map((building) => (
              <tr key={building.id} className="users-row">
                <td className="users-td" data-label="Nombre">{building.name}</td>
                <td className="users-td" data-label="Dirección">{building.address}</td>
                <td className="users-td users-td--actions" data-label="Acciones">
                  <button type="button" className="users-action-btn" onClick={() => openEditModal(building)}>
                    Editar
                  </button>
                  <button
                    type="button"
                    className="users-action-btn users-action-btn--danger"
                    onClick={() => setBuildingToDelete(building)}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <BuildingFormModal
        open={formOpen}
        mode={formMode}
        initialData={editingBuilding}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      <ConfirmModal
        open={!!buildingToDelete}
        title="Eliminar edificio"
        message={buildingToDelete ? `¿Seguro que querés eliminar "${buildingToDelete.name}"? Esta acción no se puede deshacer.` : ""}
        onCancel={() => setBuildingToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
