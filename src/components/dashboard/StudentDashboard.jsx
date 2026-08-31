import { studentData } from "../../data/studentData";
import ProfileCard from "./ProfileCard";
import StatsRow from "./StatsRow";
import CourseList from "./CourseList";
import UpcomingEvents from "./UpcomingEvents";
import ThemeToggle from "../common/ThemeToggle";
import "./Dashboard.css";

export default function StudentDashboard() {
  const { perfil, stats, materiasEnCurso, proximosEventos } = studentData;

  return (
    <div className="dash-page">
      <div className="dash-top-bar">
      </div>

      <ProfileCard perfil={perfil} />
      <StatsRow stats={stats} />

      <div className="dash-grid">
        <CourseList materias={materiasEnCurso} />
        <UpcomingEvents eventos={proximosEventos} />
      </div>
    </div>
  );
}
