import { weekdayLabel, formatTime } from "../../features/sections/components/SectionScheduleFormModal";

export const WEEKDAYS = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO"];

// Índice de Date.getDay() (0 = domingo) para cada día de WEEKDAYS, así se
// puede resaltar la columna de "hoy".
const WEEKDAY_JS_INDEX = { LUNES: 1, MARTES: 2, MIERCOLES: 3, JUEVES: 4, VIERNES: 5, SABADO: 6 };

// Grilla semanal (lunes a sábado) con columnas por día y bloques apilados por
// horario. La lógica de agrupar/ordenar horarios vive acá para no duplicarla
// entre la Grilla horaria de Cursadas (admin, ver GrillaHorariaTab) y la
// Agenda del alumno (dashboard). El contenido de cada bloque queda a cargo de
// `renderBlock`, porque cada pantalla muestra datos distintos (con/sin
// docente, etc). Usa las mismas clases CSS de siempre: .grilla-horaria* (ver
// src/features/sections/cursadasPage.css).
export default function WeekScheduleGrid({
  schedules,
  renderBlock,
  getBlockTitle,
  getKey,
  emptyMessage = "No hay horarios para mostrar.",
  highlightToday = true,
}) {
  const todayWeekday = highlightToday ? new Date().getDay() : null;

  const scheduleByDay = WEEKDAYS.reduce((acc, day) => {
    acc[day] = schedules
      .filter((sch) => sch.weekday === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
    return acc;
  }, {});

  const hasAnySchedule = Object.values(scheduleByDay).some((list) => list.length > 0);

  if (!hasAnySchedule) {
    return <p className="users-empty">{emptyMessage}</p>;
  }

  return (
    <div className="grilla-horaria">
      {WEEKDAYS.map((day) => (
        <div
          key={day}
          className={`grilla-horaria-col ${WEEKDAY_JS_INDEX[day] === todayWeekday ? "grilla-horaria-col--today" : ""}`}
        >
          <div className="grilla-horaria-col-header">{weekdayLabel(day)}</div>
          {scheduleByDay[day].length === 0 && <p className="grilla-horaria-empty">—</p>}
          {scheduleByDay[day].map((sch) => (
            <div
              key={getKey(sch)}
              className="grilla-horaria-block"
              title={getBlockTitle ? getBlockTitle(sch) : undefined}
            >
              <span className="grilla-horaria-block-time">
                {formatTime(sch.startTime)}–{formatTime(sch.endTime)}
              </span>
              {renderBlock(sch)}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
