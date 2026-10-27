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
  // El plan elegido en el desplegable es el que se edita o elimina: no hace falta listarlo de nuevo abajo.
  const selectedPlan = studyPlans.find((sp) => String(sp.id) === String(studyPlanId));

  return (
    <>
      <div className="plans-selectors">
        <div className="users-form-field">
          <label className="users-form-label" htmlFor="studyPlanSelector-1">Carrera</label>
          <select id="studyPlanSelector-1"
            value={programId}
            onChange={(e) => onProgramChange(e.target.value)}
            className="users-form-input"
          >
            {programs.length === 0 && <option value="">No hay carreras cargadas</option>}
            {programs.length > 0 && <option value="">Seleccioná una carrera...</option>}
            {programs.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="users-form-field">
          <label className="users-form-label" htmlFor="studyPlanSelector-2">Plan de estudio</label>
          <select id="studyPlanSelector-2"
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

        <div className="plans-plan-actions">
          <button
            type="button"
            className="users-btn users-btn--ghost"
            disabled={!programId}
            onClick={onNewPlanClick}
          >
            + Nuevo plan
          </button>
          {selectedPlan && (
            <>
              <button type="button" className="users-action-btn" onClick={() => onEditPlanClick(selectedPlan)}>
                Editar plan
              </button>
              <button type="button" className="users-action-btn users-action-btn--danger" onClick={() => onDeletePlanClick(selectedPlan)}>
                Eliminar plan
              </button>
            </>
          )}
        </div>
      </div>

      <hr className="plans-divider" />
    </>
  );
}
