import { userService } from '../services/usersService';
import { useTable } from '../../../shared/hooks/UseTable';
import { useFilters } from '../../../shared/hooks/UseFilters';
import { usePagination } from '../../../shared/hooks/UsePagination';
import { useCrud } from '../../../shared/hooks/useCrud';
import { usersColumns } from "../config/usersColumns";
import { getTableActions } from '../../../shared/ui/table/TableAction';


const useUsersPage = () => {

    const { filters, updateFilters, resetFilters } = useFilters({
        search: '',
        role: '',
        isActive: null,
        //aca se le agrega mas filtros.Primero capturarlos en el servicio.
    });

    const columns = usersColumns;
    
 

    const { page, size, handlePageChange } = usePagination();
    const { data, loading, total, totalPages, refresh } = useTable(
        userService,
        filters,
        page,
        size
    );

    const crud = useCrud(userService, refresh, null);
    //el orden de declaracion importa, no puedo usar crud en actions si lo delcaro despues que este.
    const actions = getTableActions({
        onView: crud.handleViewDetails,
        onEdit: crud.handleOpenEdit,
        onDelete: crud.handleDelete
    });

    return {
        //de los filtros
        filters,
        updateFilters,
        resetFilters,

        columns,
        actions,

        //del paginador
        page,
        size,
        handlePageChange,

        crud,

        //datos que muestra la tabla
        users: data,
        loading,
        total,
        totalPages,
        refresh,
    };
};

export default useUsersPage;