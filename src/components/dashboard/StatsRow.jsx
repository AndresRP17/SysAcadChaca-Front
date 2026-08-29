import StatCard from "./StatCard";

export default function StatsRow({ stats }) {
  return (
    <div className="dash-stats-row">
      <StatCard label="Promedio general" value={stats.promedio} />
      <StatCard label="Materias aprobadas" value={stats.materiasAprobadas} />
      <StatCard label="Materias en curso" value={stats.materiasEnCurso} />
    </div>
  );
}
