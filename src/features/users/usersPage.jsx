import { useState } from 'react';
import { Plus, Search, UserPlus, Edit, Trash2, UserX, UserCheck } from 'lucide-react';
import useUsersPage from './hooks/usersPage';
import { Table } from '../../shared/ui/table/Table';
import './usersPage.css';



export default function Users() {


  const {
    users,
    page,
    totalPages,
    handlePageChange,

    updateFilters,
    handleSearch,

    crud,

    refresh,
    columns,
    actions
  } = useUsersPage();


  return (
    <div className="page-container users-page">
     
  
      <Table columns={columns} data={users} actions={actions} />




             
    </div>
  );
}