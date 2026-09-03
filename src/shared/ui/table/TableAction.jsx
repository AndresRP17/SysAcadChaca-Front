import { Eye, Pencil, Trash2 } from 'lucide-react';


export const getTableActions = (handlers, user) => {
    const actions = [];
   


    if (handlers.onView) {
        actions.push({
            name: 'view',
            icon: <Eye size={18} />,
            handler: handlers.onView
        });
    }


    if (handlers.onEdit) {
        actions.push({
            name: 'edit',
            icon: <Pencil size={18} />,
            handler: handlers.onEdit
        });
    }


    if (handlers.onDelete) {
        actions.push({
            name: 'delete',
            icon: <Trash2 size={18} />,
            handler: handlers.onDelete
        });
    }

    return actions;
};