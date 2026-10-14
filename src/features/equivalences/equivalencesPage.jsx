import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { getErrorMessage } from "../../shared/api/api";
import { getCurrentStudent } from "../../shared/api/currentStudent";
import ConfirmModal from "../../shared/ui/ConfirmModal";
import SearchCombobox from "../../shared/ui/SearchCombobox";
import { studentOption, teacherOption } from "../../shared/ui/searchOptions";
import { searchStudents } from "../users/services/studentService";
import { getMyTeacherProfile, getTeacher, searchTeachers } from "../users/services/teacherService";
import { deleteEquivalence, getEquivalences, rejectEquivalence } from "./services/equivalenceService";
import EquivalenceList from "./components/EquivalenceList";
import EquivalenceFormModal from "./components/EquivalenceFormModal";
import WithoutSectionsPanel from "./components/WithoutSectionsPanel";
import { ApproveModal, EvaluatorModal } from "./components/ResolveModals";
import { STATUS_LABELS, TYPE_HELP, TYPE_LABELS } from "./equivalenceLabels";
import "../users/usersPage.css";
import "./equivalences.css";

const STATUS_FILTERS = [["", "Todas"], ...Object.entries(STATUS_LABELS)];

export default function EquivalencesPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const role = user?.role;
  const isAlumno = role === "Alumno";
  const isDocente = role === "Docente";
  const isAdmin = role === "Administrador";
  const isStaff = role === "Administrador" || role === "Bedel";

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [myStudent, setMyStudent] = useState(null);
  const [myTeacher, setMyTeacher] = useState(null);

  const [status, setStatus] = useState(isDocente ? "PENDING" : "");
  const [type, setType] = useState("");
  const [studentFilter, setStudentFilter] = useState("");
  const [evaluatorFilter, setEvaluatorFilter] = useState("");
  const [courseText, setCourseText] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [approving, setApproving] = useState(null);
  const [assigning, setAssigning] = useState(null);
  const [confirm, setConfirm] = useState(null); // { kind: 'delete'|'reject', item }

  // Datos auxiliares segun el rol (listas para filtros / formularios).
  useEffect(() => {
    if (isAlumno) {
      getCurrentStudent(user).then(setMyStudent).catch((e) => setError(getErrorMessage(e)));
    } else if (isDocente) {
      getMyTeacherProfile().then(setMyTeacher).catch((e) => setError(getErrorMessage(e)));
    }
  }, [isAlumno, isStaff, isDocente, user]);

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setItems(await getEquivalences({ status, type, student_id: studentFilter, evaluator_teacher_id: evaluatorFilter }));
    } catch (e) {
      setError(getErrorMessage(e, "No pudimos cargar las equivalencias."));
    } finally {
      setLoading(false);
    }
  }, [status, type, studentFilter, evaluatorFilter]);

  useEffect(() => {
    reload();
  }, [reload, reloadKey]);

  const visible = useMemo(() => {
    let list = items;
    if (isDocente && myTeacher) {
      // Bandeja del evaluador: las asignadas a el o todavia sin evaluador.
      list = list.filter((e) => e.evaluatorTeacherId == null || e.evaluatorTeacherId === myTeacher.id);
    }
    const q = courseText.trim().toLowerCase();
    if (q) list = list.filter((e) => `${e.courseName} ${e.courseCode}`.toLowerCase().includes(q));
    return list;
  }, [items, isDocente, myTeacher, courseText]);

  const blockedCourseIds = useMemo(
    () => items.filter((e) => isAlumno && e.status !== "REJECTED").map((e) => e.curriculumCourseId),
    [items, isAlumno],
  );

  function openForm(item = null) {
    setEditing(item);
    setFormOpen(true);
  }

  function done(message) {
    showToast(message);
    setFormOpen(false);
    setEditing(null);
    setApproving(null);
    setAssigning(null);
    setConfirm(null);
    setReloadKey((k) => k + 1);
  }

  async function handleConfirm() {
    if (confirm.kind === "delete") {
      await deleteEquivalence(confirm.item.id);
      done("Solicitud eliminada.");
    } else {
      await rejectEquivalence(confirm.item.id);
      done("Equivalencia rechazada.");
    }
  }

  const loadStudentOptions = async (q) => {
    const page = await searchStudents({ q });
    return { items: page.items.map(studentOption), total: page.total };
  };
  const loadTeacherOptions = async (q) => {
    const page = await searchTeachers({ q });
    return { items: page.items.map(teacherOption), total: page.total };
  };

  function renderActions(e) {
    const pending = e.status === "PENDING";
    const buttons = [];
    if (isAlumno && pending) {
      buttons.push(["Editar", "ghost", () => openForm(e)], ["Cancelar solicitud", "danger", () => setConfirm({ kind: "delete", item: e })]);
    }
    if (isStaff) {
      if (pending) {
        buttons.push(["Editar", "ghost", () => openForm(e)], ["Evaluador", "ghost", () => setAssigning(e)]);
      }
      if (isAdmin && pending) {
        buttons.push(["Aprobar", "success", () => setApproving(e)], ["Rechazar", "ghost", () => setConfirm({ kind: "reject", item: e })]);
      }
      if (pending || isAdmin) buttons.push(["Eliminar", "danger", () => setConfirm({ kind: "delete", item: e })]);
    }
    if (isDocente && pending) {
      const mine = e.evaluatorTeacherId == null || e.evaluatorTeacherId === myTeacher?.id;
      if (mine) buttons.push(["Aprobar", "success", () => setApproving(e)], ["Rechazar", "ghost", () => setConfirm({ kind: "reject", item: e })]);
    }
    if (buttons.length === 0) return <span className="equiv-sub">Sin acciones</span>;
    return buttons.map(([label, variant, onClick]) => (
      <button key={label} type="button" className={`users-btn users-btn--${variant} equiv-btn`} onClick={onClick}>
        {label}
      </button>
    ));
  }

  const confirmCopy =
    confirm?.kind === "reject"
      ? {
          title: "Rechazar equivalencia",
          message: `¿Rechazar la solicitud de ${confirm.item.studentLastName}, ${confirm.item.studentFirstName} para "${confirm.item.courseName}"? El alumno podrá volver a pedirla.`,
          confirmLabel: "Rechazar",
        }
      : confirm
        ? {
            title: isAlumno ? "Cancelar solicitud" : "Eliminar equivalencia",
            message: `¿Seguro que querés ${isAlumno ? "cancelar" : "eliminar"} la solicitud de "${confirm.item.courseName}"?${
              confirm.item.status === "APPROVED" ? " Estaba aprobada: la materia dejará de contar como aprobada." : ""
            }`,
            confirmLabel: isAlumno ? "Cancelar solicitud" : "Eliminar",
          }
        : {};

  const subtitle = isAlumno
    ? "Pedí el reconocimiento de una materia y seguí el estado de tus solicitudes"
    : isDocente
      ? "Solicitudes que tenés asignadas o que todavía no tienen evaluador"
      : "Bandeja de solicitudes de equivalencia";

  return (
    <div className="users-page">
      <div className="users-header">
        <div>
          <h1 className="users-title">Equivalencias</h1>
          <p className="users-subtitle">{subtitle}</p>
        </div>
        {(isAlumno || isStaff) && (
          <button type="button" className="users-btn users-btn--primary equiv-btn" onClick={() => openForm()}>
            {isAlumno ? "Nueva solicitud" : "Nueva equivalencia"}
          </button>
        )}
      </div>

      {isAlumno && (
        <div className="dash-panel equiv-panel">
          <h3 className="dash-panel-title">Qué tipos hay</h3>
          {Object.keys(TYPE_LABELS).map((t) => (
            <p key={t} className="equiv-help">
              <strong>{TYPE_LABELS[t]}:</strong> {TYPE_HELP[t]}
            </p>
          ))}
          <p className="equiv-help">Cuando se aprueba, la materia cuenta como aprobada para correlativas, finales y tu promedio.</p>
        </div>
      )}

      {isStaff && <WithoutSectionsPanel reloadKey={reloadKey} />}

      <div className="equiv-filters">
        <div className="users-filter-bar" role="group" aria-label="Filtrar por estado">
          {STATUS_FILTERS.map(([key, label]) => (
            <button key={key} type="button" className={`users-filter-btn equiv-btn ${status === key ? "users-filter-btn--active" : ""}`} onClick={() => setStatus(key)}>
              {label}
            </button>
          ))}
        </div>
        <select className="users-form-input equiv-select" aria-label="Filtrar por tipo" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">Todos los tipos</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <input className="users-form-input equiv-select" aria-label="Buscar materia" placeholder="Buscar materia..." value={courseText} onChange={(e) => setCourseText(e.target.value)} />
        {isStaff && (
          <>
            <div className="equiv-combo">
              <SearchCombobox value={studentFilter} onChange={setStudentFilter} loadOptions={loadStudentOptions} placeholder="Filtrar por alumno..." emptyLabel="No se encontraron alumnos" />
            </div>
            <div className="equiv-combo">
              <SearchCombobox
                value={evaluatorFilter}
                onChange={setEvaluatorFilter}
                loadOptions={loadTeacherOptions}
                loadSelected={async (id) => teacherOption(await getTeacher(id))}
                browse
                ariaLabel="Filtrar por evaluador"
                placeholder="Filtrar por evaluador..."
                emptyLabel="No se encontraron docentes"
              />
            </div>
          </>
        )}
      </div>

      {error && (
        <p className="users-form-error" role="alert">
          {error}{" "}
          <button type="button" className="users-btn users-btn--ghost equiv-btn" onClick={() => setReloadKey((k) => k + 1)}>Reintentar</button>
        </p>
      )}

      {loading ? (
        <p className="users-empty">Cargando...</p>
      ) : visible.length === 0 ? (
        <p className="users-empty">
          {isAlumno && !status && !type && !courseText
            ? "Todavía no pediste ninguna equivalencia. Usá \"Nueva solicitud\" para empezar."
            : "No hay equivalencias que coincidan con los filtros."}
        </p>
      ) : (
        <EquivalenceList items={visible} showStudent={!isAlumno} renderActions={renderActions} />
      )}

      <EquivalenceFormModal
        open={formOpen}
        editing={editing}
        isStaff={isStaff}
        studentPlanId={myStudent?.studyPlanId}
        blockedCourseIds={blockedCourseIds}
        onClose={() => setFormOpen(false)}
        onSaved={done}
      />
      <ApproveModal item={approving} onClose={() => setApproving(null)} onDone={done} />
      <EvaluatorModal item={assigning} onClose={() => setAssigning(null)} onDone={done} />
      <ConfirmModal
        open={!!confirm}
        title={confirmCopy.title ?? ""}
        message={confirmCopy.message ?? ""}
        confirmLabel={confirmCopy.confirmLabel}
        onCancel={() => setConfirm(null)}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
