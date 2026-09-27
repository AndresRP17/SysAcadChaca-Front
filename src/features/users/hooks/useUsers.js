import { useCallback, useEffect, useMemo, useState } from "react";
import { getStudents, createStudent, updateStudent, deleteStudent } from "../services/studentService";
import { getTeachers, createTeacher, updateTeacher, deleteTeacher } from "../services/teacherService";
import { getUsersByRole, createUser, updateUser as updateUserRequest, deleteUser as deleteUserRequest } from "../services/userService";
import { getRoles } from "../services/roleService";

function studentToRow(s) {
  return {
    id: `student-${s.id}`,
    entityId: s.id,
    kind: "student",
    legajo: s.enrollmentNumber,
    nombre: s.firstName,
    apellido: s.lastName,
    email: s.email,
    rol: "Alumno",
    estado: s.active ? "Activo" : "Inactivo",
    raw: s,
  };
}

function teacherToRow(t) {
  return {
    id: `teacher-${t.id}`,
    entityId: t.id,
    kind: "teacher",
    legajo: t.employeeNumber,
    nombre: t.firstName,
    apellido: t.lastName,
    email: t.email,
    rol: "Docente",
    estado: t.active ? "Activo" : "Inactivo",
    raw: t,
  };
}

// Bedel (y cualquier otro rol sin tabla de perfil propia) sale de /users a
// secas: no tiene legajo, así que la fila lo deja en blanco.
function userToRow(u) {
  return {
    id: `user-${u.id}`,
    entityId: u.id,
    kind: "user",
    legajo: "",
    nombre: u.firstName,
    apellido: u.lastName,
    email: u.email,
    rol: u.roleName,
    estado: u.active ? "Activo" : "Inactivo",
    raw: u,
  };
}

// studentsOnly: la pantalla del Bedel maneja solo alumnos y no pide /teachers ni /users.
export function useUsers({ studentsOnly = false } = {}) {
  const [rawUsers, setRawUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("Todos");

  useEffect(() => {
    if (studentsOnly) return;
    getRoles().then(setRoles).catch(() => setRoles([]));
  }, [studentsOnly]);

  const bedelRoleId = roles.find((r) => r.name === "Bedel")?.id ?? null;

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [students, teachers, bedeles] = await Promise.all([
        getStudents(),
        studentsOnly ? [] : getTeachers(),
        studentsOnly || !bedelRoleId ? [] : getUsersByRole(bedelRoleId),
      ]);
      setRawUsers([
        ...students.map(studentToRow),
        ...teachers.map(teacherToRow),
        ...bedeles.map(userToRow),
      ]);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [studentsOnly, bedelRoleId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const filteredUsers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return rawUsers.filter((user) => {
      const matchesRole = roleFilter === "Todos" || user.rol === roleFilter;

      const matchesSearch =
        term === "" ||
        user.nombre.toLowerCase().includes(term) ||
        user.apellido.toLowerCase().includes(term) ||
        (user.legajo ?? "").toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term);

      return matchesRole && matchesSearch;
    });
  }, [rawUsers, searchTerm, roleFilter]);

  async function addUser(data) {
    try {
      if (data.rol === "Alumno") {
        await createStudent(data.payload);
      } else if (data.rol === "Docente") {
        await createTeacher(data.payload);
      } else {
        await createUser({ ...data.payload, role_id: bedelRoleId });
      }
      await reload();
    } catch (e) {
      // devuelve los errores de validación al componente
      if (e.response?.status === 422) {
        throw e.response.data; // { error, errors: { campo: mensaje } }
      }
      throw e;
    }
  }

  async function updateUser(user, data) {
    if (user.kind === "student") {
      await updateStudent(user.entityId, data.payload);
    } else if (user.kind === "teacher") {
      await updateTeacher(user.entityId, data.payload);
    } else {
      await updateUserRequest(user.entityId, { ...data.payload, role_id: user.raw.roleId });
    }
    await reload();
  }

  async function deleteUser(user) {
    if (user.kind === "student") {
      await deleteStudent(user.entityId);
    } else if (user.kind === "teacher") {
      await deleteTeacher(user.entityId);
    } else {
      await deleteUserRequest(user.entityId);
    }
    await reload();
  }

  return {
    users: filteredUsers,
    totalCount: rawUsers.length,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    roleFilter,
    setRoleFilter,
    addUser,
    updateUser,
    deleteUser,
  };
}
