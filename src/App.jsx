import { RouterProvider } from "react-router-dom";
import { router } from "./app/routes/index.jsx";
import "./styles/theme.css";

export default function App() {
  return <RouterProvider router={router} />;
}
