const TYPE_TITLES = {
  ALUMNO_REGULAR: "Certificado de alumno regular",
  ANALITICO: "Certificado analítico",
  MATERIAS_APROBADAS: "Certificado de materias aprobadas",
};

const RESULT_LABELS = {
  PROMOCIONADO: "Promocionado",
  REGULAR: "Regular",
  LIBRE: "Libre",
  EN_CURSO: "Cursando",
  BAJA: "Baja",
};

// "2026-09-27" -> "27/09/2026" (el backend manda la fecha ISO).
function formatIssueDate(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value ?? ""));
  return m ? `${m[3]}/${m[2]}/${m[1]}` : String(value ?? "");
}

// El reporte que devuelve el backend al emitir (GET/PUT .../issue) es siempre
// el mismo expediente completo para ANALITICO/MATERIAS_APROBADAS (ver
// StudentHistoryService::summarizeForStudent) -- acá se decide qué mostrar de
// eso según el tipo, en vez de duplicar lógica de filtrado en el backend.
export default function CertificateReportView({ certificate, report }) {
  const { profile } = report;
  const isAlumnoRegular = certificate.type === "ALUMNO_REGULAR";
  const approvedOnly = certificate.type === "MATERIAS_APROBADAS";

  const courses = isAlumnoRegular
    ? []
    : (report.courses ?? []).filter((c) => !approvedOnly || c.result === "PROMOCIONADO");

  const approvedExams = isAlumnoRegular
    ? []
    : (report.exams ?? []).filter((e) => e.status === "present" && e.finalGrade != null && e.finalGrade >= 6);

  return (
    <div className="certificate-report">
      <header className="certificate-letterhead">
        <p className="certificate-letterhead-univ">Universidad Tecnológica Nacional</p>
        <p className="certificate-letterhead-fac">Facultad Regional Chacabuco</p>
      </header>
      <h2 className="certificate-report-title">{TYPE_TITLES[certificate.type] ?? certificate.type}</h2>
      <p className="certificate-report-meta">
        {certificate.id != null && <span>Folio N° {String(certificate.id).padStart(6, "0")} · </span>}
        Emitido el {formatIssueDate(certificate.issueDate)} — {certificate.issuedByName}
      </p>

      <div className="dash-panel">
        <p><strong>{profile.firstName} {profile.lastName}</strong></p>
        <p>Legajo N° {profile.enrollmentNumber}</p>
        <p>{profile.programName} (plan {profile.resolutionYear})</p>
        <p>{profile.email}</p>
      </div>

      {isAlumnoRegular && (
        <p className="certificate-report-statement">
          Se deja constancia de que el/la alumno/a arriba mencionado/a se encuentra regularmente inscripto/a
          en la carrera y plan de estudio indicados, a la fecha de emisión de este certificado.
        </p>
      )}

      {!isAlumnoRegular && (
        <div className="dash-panel">
          <h3 className="dash-panel-title">{approvedOnly ? "Materias promocionadas" : "Materias cursadas"}</h3>
          {courses.length === 0 ? (
            <p className="users-empty">No hay materias para mostrar.</p>
          ) : (
            <ul className="dash-list">
              {courses.map((c, i) => (
                <li key={i} className="dash-list-item">
                  <div>
                    <p className="dash-list-item-title">{c.courseName} — Comisión {c.sectionName}</p>
                    <p className="dash-list-item-sub">
                      {c.academicYear} · {c.term}° cuatrimestre{c.finalGrade != null ? ` · nota ${c.finalGrade}` : ""}
                    </p>
                  </div>
                  <span className="dash-badge dash-badge--navy">{RESULT_LABELS[c.result] ?? c.result}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {!isAlumnoRegular && (
        <div className="dash-panel">
          <h3 className="dash-panel-title">{approvedOnly ? "Finales aprobados" : "Finales rendidos"}</h3>
          {(approvedOnly ? approvedExams : report.exams ?? []).length === 0 ? (
            <p className="users-empty">No hay finales para mostrar.</p>
          ) : (
            <ul className="dash-list">
              {(approvedOnly ? approvedExams : report.exams).map((e, i) => (
                <li key={i} className="dash-list-item">
                  <div>
                    <p className="dash-list-item-title">{e.courseName}</p>
                    <p className="dash-list-item-sub">{e.scheduledAt}</p>
                  </div>
                  <span className="dash-badge dash-badge--navy">{e.finalGrade ?? e.status}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="certificate-signature">
        <div className="certificate-signature-line" />
        <p className="certificate-signature-name">{certificate.issuedByName}</p>
        <p className="certificate-signature-role">Secretaría Académica — Facultad Regional Chacabuco</p>
        <p className="certificate-signature-date">Chacabuco, {formatIssueDate(certificate.issueDate)}</p>
      </div>

      <button type="button" className="users-btn users-btn--primary no-print" onClick={() => window.print()}>
        Imprimir / Guardar como PDF
      </button>
    </div>
  );
}
