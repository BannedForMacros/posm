import React, { useState, useCallback } from 'react';
import MainLayout from '@/Layouts/MainLayout';
import DataTable from 'react-data-table-component';
import IconButton from '@/Components/ui/IconButton';
import { Plus, Eye, Edit, Trash2 } from 'lucide-react';
import { useProveedores } from './hooks/useProveedores';
import { customStyles } from './styles/tableStyles';

import CreateModal from './components/CreateModal';
import EditModal from './components/EditModal';
import ViewModal from './components/ViewModal';

const ProveedoresIndex = () => {
  const {
    proveedores,
    loading,
    eliminarProveedor,
    loadProveedores
  } = useProveedores();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [proveedorEditar, setProveedorEditar] = useState(null);
  const [proveedorView, setProveedorView] = useState(null);

  // Estado para la query de búsqueda
  const [searchQuery, setSearchQuery] = useState('');

  const columns = [
    {
      name: 'RUC',
      selector: row => row.ruc,
      sortable: true,
    },
    {
      name: 'Razón Social',
      selector: row => row.razon_social,
      sortable: true,
      grow: 2
    },
    {
      name: 'Dirección',
      selector: row => row.direccion,
      sortable: true,
      grow: 2
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
              setProveedorView(row);
              setIsViewOpen(true);
            }}
          />
          <IconButton
            icon={Edit}
            label="Editar"
            variant="warning"
            size="sm"
            onClick={() => {
              setProveedorEditar(row);
              setIsEditOpen(true);
            }}
          />
          <IconButton
            icon={Trash2}
            label="Eliminar"
            variant="danger"
            size="sm"
            onClick={() => eliminarProveedor(row.id)}
          />
        </div>
      )
    }
  ];

  // Usando useCallback para memoizar la función
  const handleProveedorCreated = useCallback(async () => {
    await loadProveedores();
  }, [loadProveedores]);

  // Filtrado de proveedores en función de la búsqueda
  const filteredProveedores = proveedores.filter((proveedor) => {
    const query = searchQuery.toLowerCase();
    return (
      proveedor.ruc.toLowerCase().includes(query) ||
      proveedor.razon_social.toLowerCase().includes(query) ||
      proveedor.direccion.toLowerCase().includes(query)
    );
  });

  return (
    <MainLayout>
      <div className="container mx-auto p-6 bg-white shadow-lg rounded-lg">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Gestión de Proveedores</h1>
          <IconButton
            icon={Plus}
            label="Crear Proveedor"
            variant="primary"
            size="md"
            onClick={() => setIsCreateOpen(true)}
          />
        </div>

        {/* Buscador en tiempo real */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-1/2 px-4 py-2 border rounded"
          />
        </div>

        <DataTable
          columns={columns}
          data={filteredProveedores}
          customStyles={customStyles}
          progressPending={loading}
          progressComponent={<div className="text-center p-4">Cargando proveedores...</div>}
          noDataComponent={<div className="text-center p-4">No hay proveedores registrados.</div>}
          highlightOnHover
          pointerOnHover
        />

        <CreateModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onCreated={handleProveedorCreated}
        />

        <EditModal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          proveedor={proveedorEditar}
          onEdited={loadProveedores} 
        />

        <ViewModal
          isOpen={isViewOpen}
          onClose={() => setIsViewOpen(false)}
          proveedor={proveedorView}
        />
      </div>
    </MainLayout>
  );
};

export default ProveedoresIndex;
