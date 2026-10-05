// El backend manda las horas como "HH:MM:SS"; las pasamos a minutos para poder
// compararlas con números y no con strings.
function toMinutes(time) {
  if (!time) return 0;
  const [hours, minutes] = time.split(":");
  return Number(hours) * 60 + Number(minutes);
}

export function schedulesOverlap(a, b) {
  if (a.weekday !== b.weekday) return false;
  return toMinutes(a.startTime) < toMinutes(b.endTime) && toMinutes(b.startTime) < toMinutes(a.endTime);
}

// candidateSchedules: horarios de la comisión que quiere agregar.
// enrolled: [{ section, schedules }] — las comisiones en las que ya está inscripto.
// Devuelve [{ sectionName, courseName, candidateSchedule, enrolledSchedule }].
export function findScheduleConflicts(candidateSchedules, enrolled) {
  const conflicts = [];

  candidateSchedules.forEach((candidateSchedule) => {
    enrolled.forEach((item) => {
      item.schedules.forEach((enrolledSchedule) => {
        if (schedulesOverlap(candidateSchedule, enrolledSchedule)) {
          conflicts.push({
            sectionName: item.section?.name ?? "",
            courseName: item.section?.courseName ?? "",
            candidateSchedule,
            enrolledSchedule,
          });
        }
      });
    });
  });

  return conflicts;
}
