import { useEffect, useState } from "react";
import { getPrerequisites } from "../services/prerequisiteService";

export default function CorrelativesMatrix({ curriculumCourses }) {
  const [matrix, setMatrix] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const results = await Promise.all(
          curriculumCourses.map((cc) => getPrerequisites(cc.id).then((prereqs) => [cc.courseId, prereqs])),
        );
        if (cancelled) return;

        const next = {};
        for (const [courseId, prereqs] of results) {
          next[courseId] = {};
          for (const pr of prereqs) {
            next[courseId][pr.requiredCourseId] = pr.conditionType;
          }
        }
        setMatrix(next);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (curriculumCourses.length > 0) {
      load();
    } else {
      setMatrix({});
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [curriculumCourses]);

  if (loading) return <p className="users-empty">Cargando matriz...</p>;
  if (error) return <p className="users-form-error">{error}</p>;

  return (
    <div className="correlatives-matrix-wrapper">
      <table className="correlatives-matrix">
        <thead>
          <tr>
            <th className="correlatives-matrix-corner">Materia \ requiere</th>
            {curriculumCourses.map((col) => (
              <th key={col.id} title={col.courseName} className="correlatives-matrix-head">
                {col.courseCode}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {curriculumCourses.map((row) => (
            <tr key={row.id}>
              <th className="correlatives-matrix-rowhead" title={row.courseName}>
                {row.courseCode}
              </th>
              {curriculumCourses.map((col) => {
                if (row.id === col.id) {
                  return <td key={col.id} className="correlatives-matrix-cell correlatives-matrix-cell--self" />;
                }
                const condition = matrix[row.courseId]?.[col.courseId];
                return (
                  <td key={col.id} className="correlatives-matrix-cell">
                    {condition && (
                      <span
                        className={`users-badge ${condition === "APROBADA" ? "users-badge--navy" : "users-badge--gray"}`}
                        title={`${row.courseName} requiere ${col.courseName} (${condition === "APROBADA" ? "Aprobada" : "Cursada"})`}
                      >
                        {condition === "APROBADA" ? "A" : "C"}
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="correlatives-matrix-legend">
        Cada fila es una materia; las columnas marcadas son sus correlativas requeridas —{" "}
        <span className="users-badge users-badge--gray">C</span> Cursada,{" "}
        <span className="users-badge users-badge--navy">A</span> Aprobada.
      </p>
    </div>
  );
}
