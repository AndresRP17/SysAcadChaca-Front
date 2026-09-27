function formatDate(isoDate) {
  const [y, m, d] = isoDate.split("-");
  return `${d}/${m}/${y}`;
}

// Aviso de la ventana de inscripción del alumno: hasta cuándo está abierta, o
// que está cerrada (y por eso los botones de inscripción quedan deshabilitados).
export default function EnrollmentPeriodBanner({ periods, loading, label }) {
  if (loading) return null;

  if (periods.length === 0) {
    return (
      <p className="users-form-error">
        La inscripción a {label} está cerrada en este momento. Consultá en Bedelía cuándo se abre el próximo período.
      </p>
    );
  }

  const lastEnd = periods.map((p) => p.endDate).sort().at(-1);

  return (
    <p className="users-subtitle">
      Inscripción a {label} abierta hasta el {formatDate(lastEnd)}.
    </p>
  );
}
