import { useState } from 'react';
export const usePagination = (initialPage = 1, initialSize = 5) => {
    const [page, setPage] = useState(initialPage);
    const [size] = useState(initialSize);

    const handlePageChange = (newPage) => {
        setPage(newPage);
    };

    return { page, size, handlePageChange };
};