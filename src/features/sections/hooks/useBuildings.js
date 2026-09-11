import { useCallback, useEffect, useState } from "react";
import { getBuildings, createBuilding, updateBuilding, deleteBuilding } from "../services/buildingService";

export function useBuildings() {
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setBuildings(await getBuildings());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  async function addBuilding(data) {
    await createBuilding(data);
    await reload();
  }

  async function editBuilding(id, data) {
    await updateBuilding(id, data);
    await reload();
  }

  async function removeBuilding(id) {
    await deleteBuilding(id);
    await reload();
  }

  return { buildings, loading, error, addBuilding, editBuilding, removeBuilding, reload };
}
