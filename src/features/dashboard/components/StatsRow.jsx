import StatCard from "./StatCard";

export default function StatsRow({ stats }) {
  return (
    <div className="dash-stats-row">
      <StatCard label="Promedio general" value={stats.average === null ? "-" : stats.average.toFixed(1)} />
      <StatCard label="Materias aprobadas" value={stats.approvedCourses} />
      <StatCard label="Materias en curso" value={stats.coursesInProgress} />
    </div>
  );
}
