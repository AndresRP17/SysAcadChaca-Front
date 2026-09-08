<<<<<<< HEAD
import { useState } from "react";
import { Shield } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import "./UserProfile.css";

export function UserProfile({ variant = "default", children }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const initial = (user.firstName || user.email || "?").charAt(0).toUpperCase();
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;

  return (
    <div className={`user-profile ${variant}`}>
      <button type="button" className="user-profile-trigger" onClick={() => setOpen((prev) => !prev)}>
        <span className="user-profile-avatar">{initial}</span>
        <span className="user-profile-info">
          <span className="user-profile-name">{fullName}</span>
          <span className="user-role">
            <Shield size={12} />
            {user.role}
          </span>
        </span>
      </button>

      {open && children && (
        <div className="user-profile-dropdown" onClick={() => setOpen(false)}>
          {children}
        </div>
      )}
    </div>
  );
}
=======
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

>>>>>>> origin/develop
