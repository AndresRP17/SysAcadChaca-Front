import { api } from '../../../shared/api/Api';

export const userService = {

    getAll: (page = 1, size = 10, filters = {}) => {
        const params = new URLSearchParams({ page, size });
        
        // if (filters.search) params.append('search', filters.search);
        // if (filters.roleId) params.append('roleId', filters.roleId);
        
        // if (filters.isActive !== undefined && filters.isActive !== null && filters.isActive !== '') {
        //     params.append('isActive', filters.isActive);
        // }
       
        return api.get(`/users?${params}`);
    },

    // getById: (id) => api.get(`/users/${id}`),
    create: (data) => api.post('/users', data),
    update: (id, data) => api.put(`/users/${id}`, data),
    delete: (id) => api.delete(`/users/${id}`)
};