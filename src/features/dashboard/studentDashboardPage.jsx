import { studentData } from "./data/studentData";
import ProfileCard from "./components/ProfileCard";
import StatsRow from "./components/StatsRow";
import CourseList from "./components/CourseList";
import UpcomingEvents from "./components/UpcomingEvents";
import "./studentDashboardPage.css";

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
