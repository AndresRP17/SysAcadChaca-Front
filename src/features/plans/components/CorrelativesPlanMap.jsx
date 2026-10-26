const TERM_LABEL = { 0: "Anuales", 1: "1° cuatrimestre", 2: "2° cuatrimestre" };

// Misma regla que el backend: una materia anual empieza en el 1° cuatrimestre y termina en el 2°.
const startsIn = (term) => (term === 0 ? 1 : term);
const endsIn = (term) => (term === 0 ? 2 : term);

export function isStrictlyBefore(required, target) {
  if (required.yearNumber !== target.yearNumber) return required.yearNumber < target.yearNumber;
  return endsIn(required.term) < startsIn(target.term);
}

function groupByYear(curriculumCourses) {
  const years = new Map();
  for (const cc of curriculumCourses) {
    if (!years.has(cc.yearNumber)) years.set(cc.yearNumber, new Map());
    const terms = years.get(cc.yearNumber);
    if (!terms.has(cc.term)) terms.set(cc.term, []);
    terms.get(cc.term).push(cc);
  }
  return [...years.entries()]
    .sort(([a], [b]) => a - b)
    .map(([year, terms]) => ({
      year,
      terms: [...terms.entries()].sort(([a], [b]) => a - b).map(([term, courses]) => ({ term, courses })),
    }));
}

export default function CorrelativesPlanMap({ curriculumCourses, prereqsByCourse, selectedId, onSelect }) {
  const selected = curriculumCourses.find((cc) => cc.id === selectedId);
  const needed = new Map(); // courseId -> conditionType de lo que la materia elegida requiere
  const enabled = new Map(); // courseId -> conditionType de lo que la materia elegida habilita

  if (selected) {
    for (const pr of prereqsByCourse[selected.courseId] ?? []) needed.set(pr.requiredCourseId, pr.conditionType);
    for (const cc of curriculumCourses) {
      const pr = (prereqsByCourse[cc.courseId] ?? []).find((p) => p.requiredCourseId === selected.courseId);
      if (pr) enabled.set(cc.courseId, pr.conditionType);
    }
  }

  function relation(cc) {
    if (!selected) return "";
    if (cc.id === selectedId) return "is-selected";
    if (needed.has(cc.courseId)) return `is-needed is-${needed.get(cc.courseId) === "APROBADA" ? "hard" : "soft"}`;
    if (enabled.has(cc.courseId)) return `is-enabled is-${enabled.get(cc.courseId) === "APROBADA" ? "hard" : "soft"}`;
    return "is-dim";
  }

  return (
    <div className="corr-map" role="list" aria-label="Plan de estudio por año">
      {groupByYear(curriculumCourses).map(({ year, terms }) => (
        <section key={year} className="corr-year" role="listitem">
          <h3 className="corr-year-title">{year}° año</h3>
          {terms.map(({ term, courses }) => (
            <div key={term} className="corr-term">
              <p className="corr-term-title">{TERM_LABEL[term] ?? `Cuatrimestre ${term}`}</p>
              {courses.map((cc) => {
                const requires = (prereqsByCourse[cc.courseId] ?? []).length;
                let enables = 0;
                for (const other of curriculumCourses) {
                  if ((prereqsByCourse[other.courseId] ?? []).some((p) => p.requiredCourseId === cc.courseId)) enables += 1;
                }
                const rel = relation(cc);
                return (
                  <button
                    key={cc.id}
                    type="button"
                    aria-pressed={cc.id === selectedId}
                    className={`corr-card ${rel}`}
                    onClick={() => onSelect(cc.id === selectedId ? null : cc.id)}
                  >
                    <span className="corr-card-code">{cc.courseCode}</span>
                    <span className="corr-card-name">{cc.courseName}</span>
                    <span className="corr-card-counts">
                      <span title="Materias que necesita">↑ {requires}</span>
                      <span title="Materias que habilita">↓ {enables}</span>
                    </span>
                    {rel.includes("is-needed") && (
                      <span className="corr-card-tag">{rel.includes("is-hard") ? "Necesita aprobada" : "Necesita cursada"}</span>
                    )}
                    {rel.includes("is-enabled") && (
                      <span className="corr-card-tag">{rel.includes("is-hard") ? "Habilita (aprobada)" : "Habilita (cursada)"}</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
