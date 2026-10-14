import { useCallback, useEffect, useRef, useState } from "react";
import { getErrorMessage } from "../../../shared/api/api";
import { useDebouncedValue } from "../../../shared/hooks/useDebouncedValue";
import { usePageSize } from "../../../shared/hooks/usePageSize";
import { getPrograms } from "../../plans/services/programService";
import { getStudentsPage, createStudent, updateStudent, deleteStudent } from "../services/studentService";
import { getTeacherByUserId, createTeacher, updateTeacher, deleteTeacher } from "../services/teacherService";
import { getUsersPage, createUser, updateUser as updateUserRequest, deleteUser as deleteUserRequest } from "../services/userService";
import { getRoles } from "../services/roleService";

export const SEARCH_DELAY_MS = 300;

const EMPTY_FILTERS = { search: "", role: "", active: "", program: "" };

function studentToRow(s) {
  return {
    id: `student-${s.id}`,
    entityId: s.id,
    kind: "student",
    legajo: s.enrollmentNumber,
    nombre: s.firstName,
    apellido: s.lastName,
    email: s.email,
    dni: s.nationalId,
    carrera: s.programName,
    rol: "Alumno",
    estado: s.active ? "Activo" : "Inactivo",
    raw: s,
  };
}

// La pantalla Usuarios sale de /users (Administrador, Docente y Bedel). El Docente tiene perfil
// propio (legajo, título) en /teachers: la fila queda "sin resolver" y se completa recién al
// editar o borrar (ver resolveTeacher), así el listado es una sola consulta paginada.
function userToRow(u) {
  const isTeacher = u.roleName === "Docente";
  return {
    id: `user-${u.id}`,
    entityId: u.id,
    userId: u.id,
    kind: isTeacher ? "teacher" : "user",
    teacherResolved: false,
    legajo: "",
    nombre: u.firstName,
    apellido: u.lastName,
    email: u.email,
    dni: u.nationalId,
    rol: u.roleName,
    estado: u.active ? "Activo" : "Inactivo",
    raw: u,
  };
}

function teacherToRow(row, t) {
  return {
    ...row,
    entityId: t.id,
    teacherResolved: true,
    legajo: t.employeeNumber,
    raw: t,
  };
}

// studentsOnly: la vista Alumnos (filtra por carrera) o la vista Usuarios (todo menos alumnos).
export function useUsers({ studentsOnly = false } = {}) {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeValue] = usePageSize();
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [roles, setRoles] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const requestId = useRef(0);

  const debouncedSearch = useDebouncedValue(filters.search.trim(), SEARCH_DELAY_MS);

  useEffect(() => {
    if (studentsOnly) {
      getPrograms().then(setPrograms).catch(() => setPrograms([]));
    } else {
      getRoles().then(setRoles).catch(() => setRoles([]));
    }
  }, [studentsOnly]);

  const bedelRoleId = roles.find((r) => r.name === "Bedel")?.id ?? null;
  // El filtro de rol de Usuarios ofrece todos menos Alumno.
  const roleOptions = roles
    .filter((r) => r.name !== "Alumno")
    .map((r) => ({ value: String(r.id), label: r.name }));
  const programOptions = programs.map((p) => ({ value: String(p.id), label: p.name }));

  useEffect(() => {
    const id = ++requestId.current;
    setLoading(true);
    setError("");

    const common = { q: debouncedSearch, active: filters.active, page, size: pageSize };
    const request = studentsOnly
      ? getStudentsPage({ ...common, programId: filters.program })
      : getUsersPage({ ...common, roleId: filters.role, excludeRole: "Alumno" });

    request
      .then(({ items, total: count }) => {
        if (id !== requestId.current) return;
        // Si al borrar quedó vacía la última página, se vuelve a la anterior.
        if (items.length === 0 && count > 0 && page > 1) {
          setPage(Math.ceil(count / pageSize));
          return;
        }
        setRows(items.map(studentsOnly ? studentToRow : userToRow));
        setTotal(count);
        setLoading(false);
      })
      .catch((e) => {
        if (id !== requestId.current) return;
        setError(getErrorMessage(e, "No se pudo cargar la lista."));
        setLoading(false);
      });
  }, [studentsOnly, debouncedSearch, filters.role, filters.active, filters.program, page, pageSize, reloadKey]);

  // Recarga la misma página con los mismos filtros (después de crear, editar o borrar).
  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  function changeFilter(name, value) {
    setPage(1);
    setFilters((current) => ({ ...current, [name]: value }));
  }

  function changePageSize(size) {
    setPage(1);
    setPageSizeValue(size);
  }

  function clearFilters() {
    setPage(1);
    setFilters(EMPTY_FILTERS);
  }

  const hasFilters = Boolean(filters.search || filters.role || filters.active || filters.program);

  // Completa el perfil de docente de una fila (id de docente, legajo y título) para poder editarla o borrarla.
  async function resolveTeacher(user) {
    if (user.kind !== "teacher" || user.teacherResolved) return user;
    const teacher = await getTeacherByUserId(user.userId);
    if (!teacher) throw new Error("No se encontró el perfil de docente de este usuario.");
    return teacherToRow(user, teacher);
  }

  async function addUser(data) {
    if (data.rol === "Alumno") {
      await createStudent(data.payload);
    } else if (data.rol === "Docente") {
      await createTeacher(data.payload);
    } else {
      await createUser({ ...data.payload, role_id: bedelRoleId });
    }
    reload();
  }

  async function updateUser(user, data) {
    const target = await resolveTeacher(user);
    if (target.kind === "student") {
      await updateStudent(target.entityId, data.payload);
    } else if (target.kind === "teacher") {
      await updateTeacher(target.entityId, data.payload);
    } else {
      await updateUserRequest(target.entityId, { ...data.payload, role_id: target.raw.roleId });
    }
    reload();
  }

  async function deleteUser(user) {
    const target = await resolveTeacher(user);
    if (target.kind === "student") {
      await deleteStudent(target.entityId);
    } else if (target.kind === "teacher") {
      await deleteTeacher(target.entityId);
    } else {
      await deleteUserRequest(target.entityId);
    }
    reload();
  }

  return {
    users: rows,
    total,
    page,
    setPage,
    pageSize,
    changePageSize,
    loading,
    error,
    reload,
    filters,
    changeFilter,
    clearFilters,
    hasFilters,
    roleOptions,
    programOptions,
    resolveTeacher,
    addUser,
    updateUser,
    deleteUser,
  };
}
