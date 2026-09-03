
import { useState } from 'react';

export const useFilters = (initialFilters = {}) => {
    const [filters, setFilters] = useState(initialFilters);

    const updateFilters = (newFilters) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    };

    const resetFilters = () => {
        setFilters(initialFilters);
    };

    return { filters, updateFilters, resetFilters };
};