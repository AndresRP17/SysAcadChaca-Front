import { createContext, useContext, useState } from 'react';
import { loginService } from '../features/auth/login/services/LoginService'; 

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    // Inicializamos el estado leyendo el usuario guardado
    const [user, setUser] = useState(() => loginService.getCurrentUser());
    


    const login = async (email, password) => {
        const data = await loginService.login(email, password);
        
        // Si la API devuelve un usuario, actualizamos el estado reactivo de React
        if (data.user) {
            setUser(data.user);
        }
        return data;
    };

    const logout = () => {
        loginService.logout();
        setUser(null); // Limpia el estado reactivo en React
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe usarse dentro de un <AuthProvider>');
    }
    return context;
};