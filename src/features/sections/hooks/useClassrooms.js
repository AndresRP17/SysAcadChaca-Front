import { useCallback, useEffect, useState } from "react";
import { getClassrooms, createClassroom, updateClassroom, deleteClassroom } from "../services/classroomService";

export function useClassrooms() {
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setClassrooms(await getClassrooms());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  async function addClassroom(data) {
    await createClassroom(data);
    await reload();
  }

  async function editClassroom(id, data) {
    await updateClassroom(id, data);
    await reload();
  }

  async function removeClassroom(id) {
    await deleteClassroom(id);
    await reload();
  }

  return { classrooms, loading, error, addClassroom, editClassroom, removeClassroom, reload };
}
