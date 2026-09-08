import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../../../../context/ThemeContext";
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
      {darkMode ? <Sun size={20} /> : <Moon size={20} />}
      <span className="theme-toggle-label">
        {darkMode ? "Claro" : "Oscuro"}
      </span>
    </button>
  );
}