import { useState } from "react";
import ProgramsTab from "./components/ProgramsTab";
import CoursesTab from "./components/CoursesTab";
import CurriculumTab from "./components/CurriculumTab";
import CorrelativesTab from "./components/CorrelativesTab";
import "../users/usersPage.css";
import "./plansPage.css";

const TABS = [
  { key: "programs", label: "Carreras" },
  { key: "courses", label: "Materias" },
  { key: "curriculum", label: "Estructura curricular" },
  { key: "correlatives", label: "Correlatividades" },
];

export default function PlansPage() {
  const [activeTab, setActiveTab] = useState("programs");

  return (
    <div className="users-page">
      <div className="users-header">
        <div>
          <h1 className="users-title">Gestión de Planes de Estudio</h1>
          <p className="users-subtitle">Carreras, materias y armado de la estructura curricular</p>
        </div>
      </div>

      <div className="plans-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`plans-tab ${activeTab === tab.key ? "plans-tab--active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "programs" && <ProgramsTab />}
      {activeTab === "courses" && <CoursesTab />}
      {activeTab === "curriculum" && <CurriculumTab />}
      {activeTab === "correlatives" && <CorrelativesTab />}
    </div>
  );
}
