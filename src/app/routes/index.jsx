import { createBrowserRouter, Navigate } from "react-router-dom";
import Layout from "../../features/layout/layout/Layout";
import RequireAuth from "../../features/layout/components/RequireAuth";
import RequireRole from "../../features/layout/components/RequireRole";
import NoAccessPage from "../../features/layout/components/NoAccessPage";
import { getRolesAllowedForLink } from "../../features/layout/roleLinks";
import LoginPage from "../../features/auth/login/loginPage";
import UsersPage from "../../features/users/usersPage";
import PlansPage from "../../features/plans/plansPage";
import CursadasPage from "../../features/sections/cursadasPage";
import StudentDashboardPage from "../../features/dashboard/studentDashboardPage";
import PortalCursadasPage from "../../features/enrollments/portalCursadasPage";
import PortalFinalesPage from "../../features/exams/portalFinalesPage";
import ActasPage from "../../features/exams/actasPage";
import PlanillaDocentePage from "../../features/grades/planillaDocentePage";

export const router = createBrowserRouter([
  {
    element: (
      <RequireAuth>
        <Layout />
      </RequireAuth>
    ),
    children: [
      {
        path: "/usuarios",
        element: (
          <RequireRole allow={getRolesAllowedForLink("usuarios")}>
            <UsersPage />
          </RequireRole>
        ),
      },
      {
        path: "/planes",
        element: (
          <RequireRole allow={getRolesAllowedForLink("planes")}>
            <PlansPage />
          </RequireRole>
        ),
      },
      {
        path: "/cursadas",
        element: (
          <RequireRole allow={getRolesAllowedForLink("cursadas")}>
            <CursadasPage />
          </RequireRole>
        ),
      },
      {
        path: "/alumno",
        element: (
          <RequireRole allow={getRolesAllowedForLink("alumno")}>
            <StudentDashboardPage />
          </RequireRole>
        ),
      },
      {
        path: "/mis-cursadas",
        element: (
          <RequireRole allow={getRolesAllowedForLink("mis-cursadas")}>
            <PortalCursadasPage />
          </RequireRole>
        ),
      },
      {
        path: "/finales",
        element: (
          <RequireRole allow={getRolesAllowedForLink("finales")}>
            <PortalFinalesPage />
          </RequireRole>
        ),
      },
      {
        path: "/actas",
        element: (
          <RequireRole allow={getRolesAllowedForLink("actas")}>
            <ActasPage />
          </RequireRole>
        ),
      },
      {
        path: "/planilla",
        element: (
          <RequireRole allow={getRolesAllowedForLink("planilla")}>
            <PlanillaDocentePage />
          </RequireRole>
        ),
      },
      { path: "/sin-acceso", element: <NoAccessPage /> },
    ],
  },
  { path: "/", element: <LoginPage /> },
  { path: "*", element: <Navigate to="/" replace /> },
]);
