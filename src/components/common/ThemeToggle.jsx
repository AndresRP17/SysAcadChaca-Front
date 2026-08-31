import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import "./ThemeToggle.css";

export default function ThemeToggle() {
  const { darkMode, toggleDarkMode } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleDarkMode}
      aria-label={darkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      className="theme-toggle-btn"
    >
      {darkMode ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
