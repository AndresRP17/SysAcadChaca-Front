import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

const STORAGE_KEY = "sga-theme";

// Tema inicial: lo que eligio la persona (localStorage) o, la primera vez, el
// del sistema operativo (prefers-color-scheme). Todo acceso a storage va en
// try/catch: puede fallar en ventanas privadas o con datos de sitio bloqueados.
function readInitialDark() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "dark") return true;
    if (saved === "light") return false;
  } catch {
    // sin storage: se cae al tema del sistema
  }
  try {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  } catch {
    return false;
  }
}

export function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(readInitialDark);

  // Cada vez que cambia darkMode, actualiza el atributo data-theme
  // en el <html>. Como theme.css define las variables de color
  // usando ese atributo, todas las páginas se actualizan solas.
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  function toggleDarkMode() {
    setDarkMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
      } catch {
        // la eleccion vale para esta sesion aunque no se pueda guardar
      }
      return next;
    });
  }

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme debe usarse dentro de un <ThemeProvider>");
  }
  return context;
}
