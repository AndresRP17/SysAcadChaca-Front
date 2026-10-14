import { useEffect, useState } from "react";
import { getMyProfile } from "../services/profileService";
import { isProfileComplete } from "../utils/isProfileComplete";

const PROFILE_PATH = "/perfil";

// Indica si hay que recordarle al usuario que complete su perfil. Se vuelve a consultar en cada
// cambio de pantalla: guardar en /perfil vacía el cache de GET (requestCache.js), así que al salir
// de ahí el aviso desaparece solo, sin estado compartido. Si la consulta falla, no se muestra nada.
export function useProfileReminder(pathname) {
  const [incomplete, setIncomplete] = useState(false);
  const onProfilePage = pathname.startsWith(PROFILE_PATH);

  useEffect(() => {
    if (onProfilePage) return undefined;

    let cancelled = false;
    getMyProfile()
      .then((profile) => {
        if (!cancelled) setIncomplete(!isProfileComplete(profile));
      })
      .catch(() => {
        if (!cancelled) setIncomplete(false);
      });

    return () => {
      cancelled = true;
    };
  }, [pathname, onProfilePage]);

  // En la propia pantalla de perfil no hace falta el aviso: el usuario ya está ahí.
  return incomplete && !onProfilePage;
}
