import { useCallback, useEffect, useState } from "react";
import { getErrorMessage } from "../../../shared/api/api";
import { getMyProfile, updateMyProfile } from "../services/profileService";

export function useProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setProfile(await getMyProfile());
    } catch (err) {
      setError(getErrorMessage(err, "No se pudo cargar tu perfil."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // El PUT devuelve el perfil completo actualizado: se usa tal cual, sin volver a pedirlo.
  const save = useCallback(async (form) => {
    const updated = await updateMyProfile(form);
    setProfile(updated);
    return updated;
  }, []);

  return { profile, loading, error, reload: load, save };
}
