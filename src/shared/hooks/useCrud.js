import { useState } from 'react';

export const useCrud = (service, refresh, showToast) => {
    // Estado del modal
    const [modalOpen, setModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({});

    //abrir y cerrar modal
    const openCreateModal = () => {
        setEditingItem(null);
        setFormData({});
        setModalOpen(true);
    };

    const openEditModal = (item) => {
        setEditingItem(item);
        setFormData(item);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditingItem(null);
        setFormData({});
    };

    //crear y actualizar
    const handleSave = async () => {
        try {
            if (editingItem) {
                // Editar
                await service.update(editingItem.id, formData);
                showToast('Actualizado correctamente', 'success');
            } else {
                // Crear
                await service.create(formData);
                showToast('Creado correctamente', 'success');
            }
            
            refresh();
            closeModal();
        } catch (error) {
            const message = error.response?.data?.message || error.message || 'Error al guardar';
            showToast(message, 'error');
        }
    };

    //delete
    const handleDelete = async (item) => {
        if (!confirm('¿Estás seguro de eliminar este registro?')) return;
        
        try {
            await service.delete(item.id);
            showToast('Eliminado correctamente', 'success');
            refresh();
        } catch (error) {
            const message = error.response?.data?.message || error.message || 'Error al eliminar';
            showToast(message, 'error');
        }
    };

    //ver detalles opcional
    // const [viewItem, setViewItem] = useState(null);
    // const [viewModalOpen, setViewModalOpen] = useState(false);

    // const openViewModal = (item) => {
    //     setViewItem(item);
    //     setViewModalOpen(true);
    // };

    // const closeViewModal = () => {
    //     setViewItem(null);
    //     setViewModalOpen(false);
    // };

    //retornamos para usar en el hook centralizado
    return {
        // Modal
        modalOpen,
        editingItem,
        formData,
        setFormData,
        openCreateModal,
        openEditModal,
        closeModal,
        handleSave,
        
        // Delete
        handleDelete,
        
        // View (opcional) se puede crear un boton de accion que abra un modal y muestre el detalle 
        //del alumno o depende el modulo
        // viewItem,
        // viewModalOpen,
        // openViewModal,
        // closeViewModal,
    };
};