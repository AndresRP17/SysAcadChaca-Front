export default function StudyPlanSelector({
  programs,
  programId,
  onProgramChange,
  studyPlans,
  studyPlanId,
  onStudyPlanChange,
  onNewPlanClick,
  onEditPlanClick,
  onDeletePlanClick,
}) {
  return (
    <>
      <div className="plans-selectors">
        <div className="users-form-field">
          <label className="users-form-label">Carrera</label>
          <select
            value={programId}
            onChange={(e) => onProgramChange(e.target.value)}
            className="users-form-input"
          >
            {programs.length === 0 && <option value="">No hay carreras cargadas</option>}
            {programs.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="users-form-field">
          <label className="users-form-label">Plan de estudio</label>
          <select
            value={studyPlanId}
            onChange={(e) => onStudyPlanChange(e.target.value)}
            className="users-form-input"
            disabled={!programId}
          >
            <option value="">Seleccioná un plan...</option>
            {studyPlans.map((sp) => (
              <option key={sp.id} value={sp.id}>
                Res. {sp.resolutionYear} {sp.active ? "" : "(inactivo)"}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          className="users-btn users-btn--ghost"
          disabled={!programId}
          onClick={onNewPlanClick}
        >
          + Nuevo plan
        </button>
      </div>

      {studyPlans.length > 0 && (
        <div className="plans-planlist">
          {studyPlans.map((sp) => (
            <span key={sp.id} className="plans-plan-chip">
              Res. {sp.resolutionYear}
              <button
                type="button"
                className="plans-chip-edit"
                title="Editar plan"
                onClick={() => onEditPlanClick(sp)}
              >
                ✎
              </button>
              <button
                type="button"
                className="plans-chip-delete"
                title="Eliminar plan"
                onClick={() => onDeletePlanClick(sp)}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <hr className="plans-divider" />
    </>
  );
}
