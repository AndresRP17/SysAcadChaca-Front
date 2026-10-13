import { useEffect, useState } from "react";
import Modal from "../../../shared/ui/Modal";
import Combobox from "../../../shared/ui/Combobox";
import { getErrorMessage } from "../../../shared/api/api";
import { approveEquivalence, assignEvaluator } from "../services/equivalenceService";
import { TYPE_LABELS } from "../equivalenceLabels";

// Detalle de la solicitud + nota para aprobar (por defecto la de origen).
export function ApproveModal({ item, onClose, onDone }) {
  const [grade, setGrade] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setGrade(item?.originGrade != null ? String(item.originGrade) : "");
    setError("");
  }, [item]);

  if (!item) return null;

  async function submit(e) {
    e.preventDefault();
    const n = Number(String(grade).replace(",", "."));
    if (grade === "" ) return setError("Ingresá la nota con la que se reconoce la materia (1 a 10).");
    if (Number.isNaN(n) || n < 1 || n > 10) return setError("La nota debe estar entre 1 y 10.");
    setBusy(true);
    setError("");
    try {
      await approveEquivalence(item.id, n);
      onDone("Equivalencia aprobada.");
    } catch (err) {
      setError(getErrorMessage(err, "No pudimos aprobar la equivalencia."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open title="Aprobar equivalencia" onClose={onClose}>
      <form className="users-form" onSubmit={submit} noValidate>
        <dl className="equiv-detail">
          <dt>Alumno</dt>
          <dd>{item.studentLastName}, {item.studentFirstName} (legajo {item.enrollmentNumber})</dd>
          <dt>Materia a reconocer</dt>
          <dd>{item.courseName} ({item.courseCode})</dd>
          <dt>Tipo</dt>
          <dd>{TYPE_LABELS[item.type]}</dd>
          {item.type === "EXTERNAL" ? (
            <>
              <dt>Materia de origen</dt>
              <dd>{item.originCourse} — {item.originInstitution}</dd>
            </>
          ) : (
            <>
              <dt>Motivo</dt>
              <dd>{item.reason || "—"}</dd>
            </>
          )}
        </dl>
        <div className="users-form-field">
          <label className="users-form-label" htmlFor="eq-approve-grade">
            Nota con la que se reconoce (1 a 10){item.type === "INTERNAL" ? " — nota del examen especial" : ""}
          </label>
          <input id="eq-approve-grade" className="users-form-input" inputMode="decimal" value={grade} onChange={(e) => setGrade(e.target.value)} />
        </div>
        {error && <p className="users-form-error" role="alert">{error}</p>}
        <div className="users-form-actions">
          <button type="button" className="users-btn users-btn--ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" className="users-btn users-btn--success" disabled={busy}>Aprobar</button>
        </div>
      </form>
    </Modal>
  );
}

export function EvaluatorModal({ item, teachers, onClose, onDone }) {
  const [teacherId, setTeacherId] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setTeacherId(item?.evaluatorTeacherId ?? "");
    setError("");
  }, [item]);

  if (!item) return null;

  const options = teachers.map((t) => ({
    value: t.id,
    label: `${t.lastName}, ${t.firstName} — legajo ${t.employeeNumber}`,
    searchText: `${t.lastName} ${t.firstName} ${t.employeeNumber}`,
  }));

  async function submit(e) {
    e.preventDefault();
    if (!teacherId) return setError("Elegí el docente evaluador.");
    setBusy(true);
    setError("");
    try {
      await assignEvaluator(item.id, Number(teacherId));
      onDone("Evaluador asignado.");
    } catch (err) {
      setError(getErrorMessage(err, "No pudimos asignar el evaluador."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open title="Asignar docente evaluador" onClose={onClose}>
      <form className="users-form" onSubmit={submit} noValidate>
        <p className="users-confirm-text">
          {item.courseName} — {item.studentLastName}, {item.studentFirstName}. Solo el docente asignado (o un Administrador) podrá resolverla.
        </p>
        <div className="users-form-field">
          <label className="users-form-label">Docente</label>
          <Combobox options={options} value={teacherId} onChange={setTeacherId} placeholder="Buscar docente..." emptyLabel="No se encontraron docentes" />
        </div>
        {error && <p className="users-form-error" role="alert">{error}</p>}
        <div className="users-form-actions">
          <button type="button" className="users-btn users-btn--ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" className="users-btn users-btn--primary" disabled={busy}>Asignar</button>
        </div>
      </form>
    </Modal>
  );
}
