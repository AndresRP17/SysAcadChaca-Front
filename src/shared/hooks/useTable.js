import { useState, useEffect, useCallback } from 'react';

export const useTable = (service, filters, page, size) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await service.getAll(page, size, filters);
            // setData(response.data.data);
            // setTotal(response.data.total);
            
            setData(response?.data?.data || []);
            setTotal(response?.data?.total || 0);
        } catch (error) {
            console.error('Error:', error);
            setData([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    }, [page, size, filters, service]);

    const refresh = () => fetchData();

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    const totalPages = Math.ceil(total / size);
    return { data, loading, total, totalPages, refresh };
};