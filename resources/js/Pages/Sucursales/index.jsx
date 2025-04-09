// src/Pages/Sucursales/Index.jsx
import React, { useState, useMemo } from 'react';
import MainLayout from '@/Layouts/MainLayout';
import DataTable from 'react-data-table-component';
import IconButton from '@/Components/ui/IconButton';
import { Plus, Eye, Edit, Trash2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

import { useSucursales } from './hooks/useSucursales';
import { customStyles } from './styles/tableStyles';

import CreateModal from './components/CreateModal';
import EditModal from './components/EditModal';
import ViewModal from './components/ViewModal';

const SucursalesIndex = () => {
  const { sucursales, loading, eliminarSucursal } = useSucursales();
  const [filterText, setFilterText] = useState('');

  // Estados para modales y para editar/ver sucursales
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [sucursalEditar, setSucursalEditar] = useState(null);
  const [sucursalVer, setSucursalVer] = useState(null);

  const filteredItems = useMemo(() => {
    const lowerText = filterText.toLowerCase();
    return sucursales.filter(item => {
      const estadoText = item.estado === 1 ? 'activo' : 'inactivo';
      return (
        item.nombre.toLowerCase().includes(lowerText) ||
        item.direccion.toLowerCase().includes(lowerText) ||
        estadoText.includes(lowerText)
      );
    });
  }, [sucursales, filterText]);

  const columns = [
    {
      name: 'Sucursal',
      selector: row => row.nombre,
      sortable: true,
      grow: 2
    },
    {
      name: 'Dirección',
      selector: row => row.direccion,
      sortable: true,
      grow: 3
    },
    {
      name: 'Estado',
      selector: row => row.estado,
      sortable: true,
      width: '120px',
      cell: row => (row.estado === 1 ? 'Activo' : 'Inactivo')
    },
    {
      name: 'Acciones',
      cell: row => (
        <div className="flex gap-2">
          <IconButton
            icon={Eye}
            label="Ver"
            variant="info"
            size="sm"
            onClick={() => {
              setSucursalVer(row);
              setIsViewOpen(true);
            }}
          />
          <IconButton
            icon={Edit}
            label="Editar"
            variant="warning"
            size="sm"
            onClick={() => {
              setSucursalEditar(row);
              setIsEditOpen(true);
            }}
          />
          <IconButton
            icon={Trash2}
            label="Eliminar"
            variant="danger"
            size="sm"
            onClick={() => {
              // Obtenemos el token CSRF para eliminar
              const token = document
                .querySelector('meta[name="csrf-token"]')
                .getAttribute('content');
              eliminarSucursal(row.id, token);
            }}
          />
        </div>
      ),
      width: '220px'
    }
  ];

  return (
    <MainLayout>
      <div className="container mx-auto p-6 bg-white shadow-lg rounded-lg">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Sucursales</h1>
          <IconButton
            icon={Plus}
            label="Crear Sucursal"
            variant="primary"
            size="md"
            onClick={() => setIsCreateOpen(true)}
          />
        </div>

        {/* Search Filter */}
        <div className="mb-4 relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="text"
            placeholder="Buscar sucursales..."
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
            className="pl-8 w-full md:w-96"
          />
        </div>

        <DataTable
          columns={columns}
          data={filteredItems}
          customStyles={customStyles}
          progressPending={loading}
          progressComponent={<div className="text-center p-4">Cargando sucursales...</div>}
          noDataComponent={<div className="text-center p-4">No hay sucursales registradas.</div>}
          highlightOnHover
          pointerOnHover
        />

        {/* Modals */}
        <CreateModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
        />

        <EditModal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          sucursal={sucursalEditar}
        />

        <ViewModal
          isOpen={isViewOpen}
          onClose={() => setIsViewOpen(false)}
          sucursal={sucursalVer}
        />
      </div>
    </MainLayout>
  );
};

export default SucursalesIndex;
