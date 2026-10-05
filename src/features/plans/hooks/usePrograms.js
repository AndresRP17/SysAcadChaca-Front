import { useCallback, useEffect, useState } from "react";
import { getPrograms, createProgram, updateProgram, deleteProgram } from "../services/programService";

export function usePrograms() {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setPrograms(await getPrograms());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  async function addProgram(data) {
    await createProgram(data);
    await reload();
  }

  async function editProgram(id, data) {
    await updateProgram(id, data);
    await reload();
  }

  async function removeProgram(id) {
    await deleteProgram(id);
    await reload();
  }

  return { programs, loading, error, addProgram, editProgram, removeProgram, reload };
}
