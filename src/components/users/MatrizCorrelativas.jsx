import { useMemo, useState } from "react";
import { subjects, prerequisites, studentSubjectStatus } from "../../data/correlativas";
import { getCorrelatividadInfo } from "../../utils/correlativasHelpers";
import MateriaCard from "./MateriaCard";
import "./Correlativas.css";

const DATA = { subjects, prerequisites, studentSubjectStatus };

export default function MatrizCorrelativas() {
  const [tipo, setTipo] = useState("cursar");
  const [expandedId, setExpandedId] = useState(null);

  const years = useMemo(
    () => [...new Set(subjects.map((s) => s.year))].sort((a, b) => a - b),
    []
  );

  const cardsInfo = useMemo(() => {
    const map = new Map();
    subjects.forEach((subject) => {
      map.set(subject.id, getCorrelatividadInfo(subject, tipo, DATA));
    });
    return map;
  }, [tipo]);

  return (
    <div className="correlativas-page">
      <header className="correlativas-header">
        <h1 className="correlativas-title">Correlatividades</h1>
        <p className="correlativas-subtitle">
          Licenciatura en Administración de Empresas — plan 2010
        </p>
      </header>

      <div className="correlativas-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tipo === "cursar"}
          className={"correlativas-tab" + (tipo === "cursar" ? " correlativas-tab--active" : "")}
          onClick={() => setTipo("cursar")}
        >
          Para cursar
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tipo === "rendir"}
          className={"correlativas-tab" + (tipo === "rendir" ? " correlativas-tab--active" : "")}
          onClick={() => setTipo("rendir")}
        >
          Para rendir
        </button>
      </div>

      {years.map((year) => (
        <section key={year} className="correlativas-year-block">
          <h2 className="correlativas-year-title">{year}° año</h2>
          <div className="correlativas-grid">
            {subjects
              .filter((s) => s.year === year)
              .map((subject) => (
                <MateriaCard
                  key={subject.id}
                  subject={subject}
                  info={cardsInfo.get(subject.id)}
                  expanded={expandedId === subject.id}
                  onToggle={() =>
                    setExpandedId((current) => (current === subject.id ? null : subject.id))
                  }
                />
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}