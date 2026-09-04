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