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
import ConfirmModal from "../../shared/ui/ConfirmModal";
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

export default function CertificatesPage() {
  const { user } = useAuth();
  const isAlumno = user?.role === "Alumno";
  const canManage = user?.role === "Administrador" || user?.role === "Bedel";

  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [reportView, setReportView] = useState(null); // { certificate, report }
  const [confirmAction, setConfirmAction] = useState(null); // { type: 'request'|'issue'|'reject', payload, label }

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

  function openConfirm(type, payload, label) {
    setConfirmAction({ type, payload, label });
  }

  async function handleConfirmAction() {
    const action = confirmAction;
    if (action.type === "request") {
      await requestCertificate(action.payload);
    } else if (action.type === "issue") {
      setReportView(await issueCertificate(action.payload));
    } else if (action.type === "reject") {
      await rejectCertificate(action.payload);
    }
    setConfirmAction(null);
    await reload();
  }

  async function handleView(id) {
    setBusyId(id);
    setError("");
    try {
      setReportView(await getCertificateReport(id));
    } catch (e) {
      setError(getErrorMessage(e));
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

      {error && <p className="users-form-error">{error}</p>}

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

                return (
                  <tr key={c.id}>
                    {canManage && <td className="users-td">{c.studentName}</td>}
                    <td className="users-td">{typeLabel}</td>
                    <td className="users-td users-td--center">
                      <span className={STATUS_BADGE_CLASS[c.status] ?? "dash-badge dash-badge--gray"}>
                        {STATUS_LABELS[c.status] ?? c.status}
                      </span>
                    </td>
                    <td className="users-td">{c.requestDate}</td>
                    <td className="users-td">{c.issueDate ?? "—"}</td>
                    <td className="users-td users-td--center">
                      {canManage && c.status === "PENDING" && (
                        <>
                          <button
                            type="button"
                            className="users-btn users-btn--primary"
                            onClick={() => openConfirm("issue", c.id, typeLabel)}
                          >
                            Emitir
                          </button>{" "}
                          <button
                            type="button"
                            className="users-btn users-btn--ghost"
                            onClick={() => openConfirm("reject", c.id, typeLabel)}
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
        onCancel={() => setConfirmAction(null)}
        onConfirm={handleConfirmAction}
      />
    </div>
  );
}
