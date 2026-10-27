// Letra siguiente que todavía no usa ninguna comisión de la misma materia y período ("A", "B", ...). Reconoce
// nombres como "A" o "Comisión A"; si ya se usaron las 26 no sugiere nada.
export function suggestSectionName(sections, curriculumCourseId, academicYear, term) {
  const used = new Set(
    sections
      .filter(
        (s) =>
          s.curriculumCourseId === Number(curriculumCourseId) &&
          s.academicYear === Number(academicYear) &&
          s.term === Number(term),
      )
      .map((s) => String(s.name).trim().toUpperCase().replace(/^COMISI[ÓO]N\s+/, "")),
  );

  for (let code = 65; code <= 90; code++) {
    const letter = String.fromCharCode(code);
    if (!used.has(letter)) return letter;
  }

  return "";
}
