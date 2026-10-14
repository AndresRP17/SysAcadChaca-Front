import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import AulasTab from "./components/AulasTab";
import ComisionesTab from "./components/ComisionesTab";
import GrillaHorariaTab from "./components/GrillaHorariaTab";
import EdificiosTab from "./components/EdificiosTab";
import PeriodosTab from "./components/PeriodosTab";
import "../users/usersPage.css";
import "../plans/plansPage.css";
import "./cursadasPage.css";

const TABS = [
  { key: "edificios", label: "Edificios" },
  { key: "aulas", label: "Aulas" },
  { key: "comisiones", label: "Comisiones" },
  { key: "grilla", label: "Grilla horaria" },
  { key: "periodos", label: "Períodos de inscripción" },
];

export default function CursadasPage() {
  // Desde el Calendario se llega con ?section=ID&program=ID&plan=ID: abre Comisiones con esa comision elegida.
  const [searchParams] = useSearchParams();
  const [deepLink] = useState(() => {
    const sectionId = Number(searchParams.get("section"));
    if (!sectionId) return null;
    return {
      sectionId,
      programId: searchParams.get("program") ?? "",
      studyPlanId: searchParams.get("plan") ?? "",
    };
  });
  const [activeTab, setActiveTab] = useState(deepLink ? "comisiones" : TABS[0].key);

  return (
    <div className="users-page">
      <div className="users-header">
        <div>
          <h1 className="users-title">Cursadas</h1>
          <p className="users-subtitle">Aulas, comisiones y su grilla horaria</p>
        </div>
      </div>

      <div className="plans-tabs" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.key}
            className={`plans-tab ${activeTab === tab.key ? "plans-tab--active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "grilla" && (
        <p className="calendar-notice">
          Probá el nuevo <Link to="/calendario">Calendario</Link>: ves el mes completo, filtrás por carrera, aula o
          docente y abrís cualquier comisión con un toque.
        </p>
      )}

      {activeTab === "edificios" && <EdificiosTab />}
      {activeTab === "aulas" && <AulasTab />}
      {activeTab === "comisiones" && <ComisionesTab deepLink={deepLink} />}
      {activeTab === "grilla" && <GrillaHorariaTab />}
      {activeTab === "periodos" && <PeriodosTab />}
    </div>
  );
}
