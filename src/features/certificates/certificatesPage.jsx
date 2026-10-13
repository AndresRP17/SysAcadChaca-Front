import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getErrorMessage } from "../../shared/api/api";
import {
  getCertificates,
  requestCertificate,
  issueCertificate,
  rejectCertificate,
  getCertificateReport,
} from "./services/certificateService";
import CertificateReportView from "./components/CertificateReportView";
import { useToast } from "../../context/ToastContext";
import ConfirmModal from "../../shared/ui/ConfirmModal";
import LoadError from "../../shared/ui/LoadError";
import Combobox from "../../shared/ui/Combobox";
import { getStudents } from "../users/services/studentService";
import "../users/usersPage.css";
import "./certificatesPage.css";

const TYPES = [
  { key: "ALUMNO_REGULAR", label: "Alumno regular" },
  { key: "ANALITICO", label: "Analítico" },
  { key: "MATERIAS_APROBADAS", label: "Materias aprobadas" },
];

const STATUS_LABELS = { PENDING: "Pendiente", ISSUED: "Emitido", REJECTED: "Rechazado" };
const STATUS_BADGE_CLASS = {
  PENDING: "dash-badge dash-badge--gray",
  ISSUED: "users-badge users-badge--active",
  REJECTED: "users-badge users-badge--inactive",
};

const CONFIRM_COPY = {
  request: (label) => ({
    title: "Solicitar certificado",
    message: `¿Confirmás la solicitud de "${label}"?`,
    confirmLabel: "Solicitar",
  }),
  issue: (label) => ({
    title: "Emitir certificado",
    message: `¿Confirmás la emisión del certificado de ${label}?`,
    confirmLabel: "Emitir",
  }),
  reject: (label) => ({
    title: "Rechazar certificado",
    message: `¿Confirmás el rechazo de la solicitud de ${label}?`,
    confirmLabel: "Rechazar",
  }),
};

function formatDate(isoDate) {
  if (!isoDate) return "—";
  const [y, m, d] = String(isoDate).slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

export default function CertificatesPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const isAlumno = user?.role === "Alumno";
  const canManage = user?.role === "Administrador" || user?.role === "Bedel";

  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [studentsError, setStudentsError] = useState("");
  const [viewError, setViewError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [reportView, setReportView] = useState(null); // { certificate, report }
  const [confirmAction, setConfirmAction] = useState(null); // { type: 'request'|'issue'|'reject', payload, label }
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setCertificates(await getCertificates());
    } catch (e) {
      setError(getErrorMessage(e, "No se pudieron cargar los certificados."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  // Bedel/Administrador piden el certificado en nombre de un alumno: hace falta la lista para elegirlo.
  const loadStudents = useCallback(() => {
    setStudentsError("");
    getStudents()
      .then(setStudents)
      .catch((e) => setStudentsError(getErrorMessage(e, "No pudimos cargar la lista de alumnos.")));
  }, []);

  useEffect(() => {
    if (canManage) loadStudents();
  }, [canManage, loadStudents]);

  const studentOptions = students.map((s) => ({
    value: s.id,
    label: `${s.lastName}, ${s.firstName} — legajo ${s.enrollmentNumber} (DNI ${s.nationalId}) · ${s.programName}`,
    searchText: `${s.lastName} ${s.firstName} ${s.enrollmentNumber} ${s.nationalId} ${s.programName}`,
  }));
  const selectedStudent = students.find((s) => String(s.id) === String(selectedStudentId));

  function openConfirm(type, payload, label) {
    setConfirmAction({ type, payload, label });
  }

  async function handleConfirmAction() {
    const action = confirmAction;
    if (action.type === "request") {
      await requestCertificate(action.payload, canManage ? Number(selectedStudentId) : undefined);
      showToast(canManage ? "Certificado creado." : "Solicitud enviada. Te avisamos acá cuando esté emitido.");
    } else if (action.type === "issue") {
      setReportView(await issueCertificate(action.payload));
      showToast("Certificado emitido.");
    } else if (action.type === "reject") {
      await rejectCertificate(action.payload);
      showToast("Solicitud rechazada.");
    }
    setConfirmAction(null);
    await reload();
  }

  async function handleView(id) {
    setBusyId(id);
    setViewError("");
    try {
      setReportView(await getCertificateReport(id));
    } catch (e) {
      setViewError(getErrorMessage(e, "No se pudo abrir el certificado."));
    } finally {
      setBusyId(null);
    }
  }

  if (reportView) {
    return (
      <div className="users-page">
        <button type="button" className="users-btn users-btn--ghost no-print" onClick={() => setReportView(null)}>
          ← Volver
        </button>
        <CertificateReportView certificate={reportView.certificate} report={reportView.report} />
      </div>
    );
  }

  const confirmCopy = confirmAction ? CONFIRM_COPY[confirmAction.type](confirmAction.label) : null;

  return (
    <div className="users-page">
      <div className="users-header">
        <div>
          <h1 className="users-title">Certificados</h1>
          <p className="users-subtitle">
            {isAlumno ? "Solicitá y consultá tus certificados" : "Bandeja de solicitudes de certificados"}
          </p>
        </div>
      </div>

      <LoadError message={error} onRetry={reload} />
      <LoadError message={viewError} />

      {isAlumno && (
        <div className="certificate-types">
          {TYPES.map((t) => (
            <button
              key={t.key}
              type="button"
              className="users-btn users-btn--primary"
              onClick={() => openConfirm("request", t.key, t.label)}
            >
              Solicitar {t.label}
            </button>
          ))}
        </div>
      )}

      {canManage && (
        <div className="dash-panel">
          <h3 className="dash-panel-title">Nuevo certificado para un alumno</h3>
          <div className="users-form-field" style={{ maxWidth: 480 }}>
            <label className="users-form-label">Alumno</label>
            <Combobox
              options={studentOptions}
              value={selectedStudentId}
              onChange={setSelectedStudentId}
              placeholder="Buscar por apellido, nombre, legajo o DNI..."
              emptyLabel="No se encontraron alumnos"
            />
          </div>
          <LoadError message={studentsError} onRetry={loadStudents} />
          <div className="certificate-types">
            {TYPES.map((t) => (
              <button
                key={t.key}
                type="button"
                className="users-btn users-btn--primary"
                disabled={!selectedStudentId}
                onClick={() =>
                  openConfirm("request", t.key, `${t.label} de ${selectedStudent?.lastName}, ${selectedStudent?.firstName}`)
                }
              >
                Crear {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <p className="users-empty">Cargando...</p>
      ) : certificates.length === 0 ? (
        <p className="users-empty">No hay certificados para mostrar.</p>
      ) : (
        <div className="users-table-wrapper">
          <table className="users-table">
            <thead>
              <tr>
                {canManage && <th className="users-th">Alumno</th>}
                <th className="users-th">Tipo</th>
                <th className="users-th users-th--center">Estado</th>
                <th className="users-th">Solicitado</th>
                <th className="users-th">Emitido</th>
                <th className="users-th users-th--center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {certificates.map((c) => {
                const typeLabel = TYPES.find((t) => t.key === c.type)?.label ?? c.type;
                // El modal de emitir/rechazar tiene que decir de QUIÉN es el certificado.
                const subjectLabel = c.studentName ? `${typeLabel} de ${c.studentName}` : typeLabel;

                return (
                  <tr key={c.id}>
                    {canManage && (
                      <td className="users-td" data-label="Alumno">
                        {c.studentName}
                      </td>
                    )}
                    <td className="users-td" data-label="Tipo">
                      {typeLabel}
                    </td>
                    <td className="users-td users-td--center" data-label="Estado">
                      <span className={STATUS_BADGE_CLASS[c.status] ?? "dash-badge dash-badge--gray"}>
                        {STATUS_LABELS[c.status] ?? c.status}
                      </span>
                    </td>
                    <td className="users-td" data-label="Solicitado">
                      {formatDate(c.requestDate)}
                    </td>
                    <td className="users-td" data-label="Emitido">
                      {formatDate(c.issueDate)}
                    </td>
                    <td className="users-td users-td--center" data-label="Acciones">
                      {canManage && c.status === "PENDING" && (
                        <>
                          <button
                            type="button"
                            className="users-btn users-btn--primary"
                            onClick={() => openConfirm("issue", c.id, subjectLabel)}
                          >
                            Emitir
                          </button>{" "}
                          <button
                            type="button"
                            className="users-btn users-btn--ghost"
                            onClick={() => openConfirm("reject", c.id, subjectLabel)}
                          >
                            Rechazar
                          </button>
                        </>
                      )}
                      {c.status === "ISSUED" && (
                        <button
                          type="button"
                          className="users-btn users-btn--ghost"
                          disabled={busyId === c.id}
                          onClick={() => handleView(c.id)}
                        >
                          Ver
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        open={!!confirmAction}
        title={confirmCopy?.title ?? ""}
        message={confirmCopy?.message ?? ""}
        confirmLabel={confirmCopy?.confirmLabel}
        confirmVariant={confirmAction?.type === "reject" ? "danger" : "primary"}
        onCancel={() => setConfirmAction(null)}
        onConfirm={handleConfirmAction}
      />
    </div>
  );
}
