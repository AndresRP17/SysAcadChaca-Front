<<<<<<< HEAD
import { createBrowserRouter, Navigate } from "react-router-dom";
import Layout from "../../features/layout/layout/Layout";
import RequireAuth from "../../features/layout/components/RequireAuth";
import RequireRole from "../../features/layout/components/RequireRole";
import NoAccessPage from "../../features/layout/components/NoAccessPage";
import { getRolesAllowedForLink } from "../../features/layout/roleLinks";
import LoginPage from "../../features/auth/login/loginPage";
import UsersPage from "../../features/users/usersPage";
import PlansPage from "../../features/plans/plansPage";
import StudentDashboardPage from "../../features/dashboard/studentDashboardPage";

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
        path: "/alumno",
        element: (
          <RequireRole allow={getRolesAllowedForLink("alumno")}>
            <StudentDashboardPage />
          </RequireRole>
        ),
      },
      { path: "/sin-acceso", element: <NoAccessPage /> },
    ],
  },
  { path: "/", element: <LoginPage /> },
  { path: "*", element: <Navigate to="/" replace /> },
]);
=======
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import Layout from '../../features/layout/layout/Layout';
import Login from '../../features/auth/login/loginPage';
import Users from '../../features/users/usersPage';


export const router = createBrowserRouter([
    {
        element: <Layout />,
        children: [
            { path: '/users', element: <Users /> },
        ],
    },
    { path: '/', element: <Login /> },
    { path: '*', element: <Navigate to="/" replace /> },
]);




export default function App() {
    return <RouterProvider router={router} />;
}
>>>>>>> origin/develop
