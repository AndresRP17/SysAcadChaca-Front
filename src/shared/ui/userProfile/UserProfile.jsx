import { useAuth } from '../../../context/AuthContext';
import { Shield } from 'lucide-react';
import './UserProfile.css';

export const UserProfile = ({ variant = 'default', children }) => {
    const { user } = useAuth();

    // const getRoleName = (roleId) => {
    //     const roles = {
    //         1: 'Administrador',
    //         2: 'Médico',
    //         3: 'Paciente',
    //         4: 'Recepcionista'
    //     };
    //     return roles[roleId] || 'Usuario';
    // };

    // if (!user) return null;

    return (
        <div className={`user-profile ${variant}`}>
            {/* <div className="user-profile-avatar">
                {user.username?.charAt(0).toUpperCase()}
            </div> */}

            <div className="user-profile-info">
                {/* <h4>{user.username}</h4> */}
                {/* <span className="user-role">
                    <Shield size={14} />
                    {getRoleName(user.roleId)}
                </span> */}
            </div>

            {/* El panel desplegable se arma con lo que le pases desde afuera */}
            {children && (
                <div className="user-profile-dropdown">
                    {children}
                </div>
            )}
        </div>
    );
};

