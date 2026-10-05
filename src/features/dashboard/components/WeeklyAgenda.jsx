import WeekScheduleGrid from "../../../shared/ui/WeekScheduleGrid";

// Agenda semanal del alumno: junta los horarios de todas las comisiones en
// las que está inscripto (ver useStudentSections().enrolled) en la misma
// grilla lunes-sábado que usa Cursadas > Grilla horaria, para que de un
// vistazo vea qué cursa y a qué hora.
export default function WeeklyAgenda({ schedules }) {
  return (
    <div className="dash-panel">
      <h3 className="dash-panel-title">Mi semana</h3>
      <WeekScheduleGrid
        schedules={schedules}
        emptyMessage="Todavía no estás inscripto en comisiones con horarios cargados."
        getKey={(sch) => sch.id}
        getBlockTitle={(sch) => `${sch.classroomName} — ${sch.teacherFirstName} ${sch.teacherLastName}`}
        renderBlock={(sch) => (
          <>
            <span className="grilla-horaria-block-course">{sch.courseName}</span>
            <span className="grilla-horaria-block-section">Comisión {sch.sectionName}</span>
            <span className="grilla-horaria-block-classroom">{sch.classroomName}</span>
          </>
        )}
      />
    </div>
  );
}
