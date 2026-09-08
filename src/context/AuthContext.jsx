import { createContext, useContext, useState } from "react";
import { loginService } from "../features/auth/login/services/loginService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => loginService.getCurrentUser());

  async function login(email, password) {
    const data = await loginService.login(email, password);
    if (data.user) setUser(data.user);
    return data;
  }

  function logout() {
    loginService.logout();
    setUser(null);
  }

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un <AuthProvider>");
  }
  return context;
}
