import { createBrowserRouter, Navigate } from "react-router-dom";
import Layout from "../../features/layout/layout/Layout";
import RequireAuth from "../../features/layout/components/RequireAuth";
import RequireRole from "../../features/layout/components/RequireRole";
import NoAccessPage from "../../features/layout/components/NoAccessPage";
import { getRolesAllowedForLink } from "../../features/layout/roleLinks";
import LandingPage from "../../features/landing/LandingPage/LandingPage";
import LoginPage from "../../features/auth/login/loginPage";
import UsersPage from "../../features/users/usersPage/usersPage";
import StudentsPage from "../../features/users/studentsPage";
import PlansPage from "../../features/plans/plansPage/plansPage";
import CursadasPage from "../../features/sections/cursadasPage/cursadasPage";
import StudentDashboardPage from "../../features/dashboard/studentDashboardPage/studentDashboardPage";
import HistorialAlumnoPage from "../../features/dashboard/historialAlumnoPage";
import CertificatesPage from "../../features/certificates/certificatesPage/certificatesPage";
import PortalCursadasPage from "../../features/enrollments/portalCursadasPage/portalCursadasPage";
import AuditPage from "../../features/audit/auditPage/auditPage";
import EquivalencesPage from "../../features/equivalences/equivalencesPage/equivalencesPage";
import BedelEnrollPage from "../../features/enrollments/bedelEnrollPage";
import PortalFinalesPage from "../../features/exams/portalFinalesPage";
import ActasPage from "../../features/exams/actasPage";
import SectionDetailPage from "../../features/grades/sectionDetailPage/sectionDetailPage";
import CalendarRoutePage from "../../features/calendar/calendarRoutePage";
import TakeAttendancePage from "../../features/attendance/takeAttendancePage/takeAttendancePage";
import MisComisionesPage from "../../features/grades/misComisionesPage/misComisionesPage";
import ProfilePage from "../../features/profile/profilePage/profilePage";


import { ResetPasswordPage } from '../../features/auth/resetPasswordPage/ResetPasswordPage/ResetPasswordPage';
import { VerifyEmailPage } from '../../features/auth/verifyEmail/VerifyEmail/VerifyEmail';
import { ForgotPasswordPage } from '../../features/auth/resetPassword/ForgotPasswordPage';


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
        path: "/alumnos",
        element: (
          <RequireRole allow={getRolesAllowedForLink("alumnos")}>
            <StudentsPage />
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
        path: "/historial",
        element: (
          <RequireRole allow={getRolesAllowedForLink("historial")}>
            <HistorialAlumnoPage />
          </RequireRole>
        ),
      },
      {
        path: "/certificados",
        element: (
          <RequireRole allow={getRolesAllowedForLink("certificados")}>
            <CertificatesPage />
          </RequireRole>
        ),
      },
      {
        path: "/auditoria",
        element: (
          <RequireRole allow={getRolesAllowedForLink("auditoria")}>
            <AuditPage />
          </RequireRole>
        ),
      },
      {
        path: "/equivalencias",
        element: (
          <RequireRole allow={getRolesAllowedForLink("equivalencias")}>
            <EquivalencesPage />
          </RequireRole>
        ),
      },
      {
        path: "/inscribir-alumno",
        element: (
          <RequireRole allow={getRolesAllowedForLink("inscribir-alumno")}>
            <BedelEnrollPage />
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
        path: "/mis-comisiones",
        element: (
          <RequireRole allow={getRolesAllowedForLink("mis-comisiones")}>
            <MisComisionesPage />
          </RequireRole>
        ),
      },
      {
        path: "/calendario",
        element: (
          <RequireRole allow={getRolesAllowedForLink("calendario")}>
            <CalendarRoutePage />
          </RequireRole>
        ),
      },
      {
        path: "/asistencia",
        element: (
          <RequireRole allow={["Docente"]}>
            <TakeAttendancePage />
          </RequireRole>
        ),
      },
      {
        path: "/comision/:sectionId",
        element: (
          <RequireRole allow={["Docente"]}>
            <SectionDetailPage />
          </RequireRole>
        ),
      },
      // Cualquier usuario logueado, sea cual sea su rol: es su propio perfil.
      { path: "/perfil", element: <ProfilePage /> },
      { path: "/planilla", element: <Navigate to="/mis-comisiones" replace /> },
      { path: "/sin-acceso", element: <NoAccessPage /> },
    ],
  },
  { path: "/", element: <LandingPage /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/forgot-password", element: <ForgotPasswordPage /> },
  { path: "/reset-password", element: <ResetPasswordPage /> },
  { path: "/verify-email", element: <VerifyEmailPage /> },
  { path: "*", element: <Navigate to="/" replace /> },
]);