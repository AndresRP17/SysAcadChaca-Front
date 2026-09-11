import { useCallback, useEffect, useMemo, useState } from "react";
import { getStudents, createStudent, updateStudent, deleteStudent } from "../services/studentService";
import { getTeachers, createTeacher, updateTeacher, deleteTeacher } from "../services/teacherService";

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

export function useUsers() {
  const [rawUsers, setRawUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("Todos");

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [students, teachers] = await Promise.all([getStudents(), getTeachers()]);
      setRawUsers([...students.map(studentToRow), ...teachers.map(teacherToRow)]);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

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
    } else {
      await createTeacher(data.payload);
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
    } else {
      await updateTeacher(user.entityId, data.payload);
    }
    await reload();
  }

  async function deleteUser(user) {
    if (user.kind === "student") {
      await deleteStudent(user.entityId);
    } else {
      await deleteTeacher(user.entityId);
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
