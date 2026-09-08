import { useState } from "react";
import AulasTab from "./components/AulasTab";
import ComisionesTab from "./components/ComisionesTab";
import GrillaHorariaTab from "./components/GrillaHorariaTab";
import "../users/usersPage.css";
import "../plans/plansPage.css";
import "./cursadasPage.css";

const TABS = [
  { key: "aulas", label: "Aulas" },
  { key: "comisiones", label: "Comisiones" },
  { key: "grilla", label: "Grilla horaria" },
];

export default function CursadasPage() {
  const [activeTab, setActiveTab] = useState("aulas");

  return (
    <div className="users-page">
      <div className="users-header">
        <div>
          <h1 className="users-title">Cursadas</h1>
          <p className="users-subtitle">Aulas, comisiones y su grilla horaria</p>
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

      {activeTab === "aulas" && <AulasTab />}
      {activeTab === "comisiones" && <ComisionesTab />}
      {activeTab === "grilla" && <GrillaHorariaTab />}
    </div>
  );
}
