import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import "./styles/theme.css";
import DevNav from "./components/common/DevNav";
import SysAcadLogin from "./SysAcadLogin";
import UsersPage from "./components/users/UsersPage";
import StudentDashboard from "./components/dashboard/StudentDashboard";

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <DevNav />
        <Routes>
          <Route path="/" element={<SysAcadLogin />} />
          <Route path="/usuarios" element={<UsersPage />} />
          <Route path="/alumno" element={<StudentDashboard />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
