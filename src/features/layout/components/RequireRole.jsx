import { Navigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { getDefaultRouteForRole } from "../roleLinks";

// Complementa a RequireAuth: RequireAuth solo valida que haya sesión;
// esto valida que el rol del usuario logueado pueda ver esta ruta puntual.
// Sin esto, cualquiera con sesión podía entrar a /usuarios o /planes
// escribiendo la URL a mano, aunque el Sidebar no le mostrara el link.
export default function RequireRole({ allow, children }) {
  const { user } = useAuth();

  if (!allow.includes(user?.role)) {
    return <Navigate to={getDefaultRouteForRole(user?.role)} replace />;
  }

  return children;
}
