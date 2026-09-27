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

export default function CertificatesPage() {
  const { user } = useAuth();
  const isAlumno = user?.role === "Alumno";
  const canManage = user?.role === "Administrador" || user?.role === "Bedel";

  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [reportView, setReportView] = useState(null); // { certificate, report }

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

  async function handleRequest(type) {
    setError("");
    try {
      await requestCertificate(type);
      await reload();
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }

  async function handleIssue(id) {
    setBusyId(id);
    setError("");
    try {
      const result = await issueCertificate(id);
      setReportView(result);
      await reload();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(id) {
    setBusyId(id);
    setError("");
    try {
      await rejectCertificate(id);
      await reload();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setBusyId(null);
    }
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
            <button key={t.key} type="button" className="users-btn users-btn--primary" onClick={() => handleRequest(t.key)}>
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
              {certificates.map((c) => (
                <tr key={c.id}>
                  {canManage && <td className="users-td">{c.studentName}</td>}
                  <td className="users-td">{TYPES.find((t) => t.key === c.type)?.label ?? c.type}</td>
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
                          disabled={busyId === c.id}
                          onClick={() => handleIssue(c.id)}
                        >
                          Emitir
                        </button>{" "}
                        <button
                          type="button"
                          className="users-btn users-btn--ghost"
                          disabled={busyId === c.id}
                          onClick={() => handleReject(c.id)}
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
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
