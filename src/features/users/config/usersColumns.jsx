
import { CheckCircle, XCircle, Clock, User, Mail, Calendar } from 'lucide-react';

export const usersColumns = [
    { 
        key: 'nombre', 
        label: 'Nombre',
        sortable: true,
    },
    { 
        key: 'username', 
        label: 'Usuario',
        sortable: true,
    },
    { 
        key: 'email', 
        label: 'Email',
        render: (value) => (
            <span className="flex items-center gap-2">
                <Mail size={14} className="text-gray-400" />
                {value}
            </span>
        ),
    },
    { 
        key: 'rol', 
        label: 'Rol',
        sortable: true,
    },
    { 
        key: 'status', 
        label: 'Estado',
        render: (value) => {
            const isActive = value === 'active';
            return (
                <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                    isActive 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                }`}>
                    {isActive ? (
                        <CheckCircle size={14} />
                    ) : (
                        <XCircle size={14} />
                    )}
                    {isActive ? 'Activo' : 'Inactivo'}
                </span>
            );
        },
        sortable: true,
    },
    { 
        key: 'last_access', 
        label: 'Último acceso',
        render: (value) => (
            <span className="flex items-center gap-2">
                <Clock size={14} className="text-gray-400" />
                {value ? new Date(value).toLocaleDateString('es-AR') : 'Nunca'}
            </span>
        ),
        sortable: true,
    },
];