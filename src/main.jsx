<<<<<<< HEAD
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/index.css";
import App from "./App.jsx";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";

createRoot(document.getElementById("root")).render(
  <StrictMode>
=======
import React from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from "./App.jsx";
import { ThemeProvider } from './context/ThemeContext'
import './styles/theme.css'
import { AuthProvider } from './context/AuthContext.jsx';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
>>>>>>> origin/develop
    <ThemeProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
<<<<<<< HEAD
  </StrictMode>,
);
=======
  </React.StrictMode>,
)
>>>>>>> origin/develop
