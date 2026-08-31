import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(false);

  // Cada vez que cambia darkMode, actualiza el atributo data-theme
  // en el <html>. Como theme.css define las variables de color
  // usando ese atributo, todas las páginas se actualizan solas.
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  function toggleDarkMode() {
    setDarkMode((prev) => !prev);
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
