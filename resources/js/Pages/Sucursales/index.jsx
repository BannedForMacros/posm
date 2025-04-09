// src/Pages/Sucursales/index.jsx
import React, { useState, useMemo, useCallback } from 'react';
import MainLayout from '@/Layouts/MainLayout';
import DataTable from 'react-data-table-component';
import IconButton from '@/Components/ui/IconButton';
import EstadoIndicador from '@/Components/ui/EstadoIndicador'; // Asegúrate que la ruta sea correcta
import { Plus, Eye, Edit, Trash2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

import { useSucursales } from './hooks/useSucursales';
import { customStyles } from './styles/tableStyles';

import CreateModal from './components/CreateModal';
import EditModal from './components/EditModal';
import ViewModal from './components/ViewModal';

const SucursalesIndex = () => {
  // Solo una instancia del hook en el componente padre
  const {
    sucursales,
    loading,
    eliminarSucursal,
    crearSucursal,
    loadSucursales,
  } = useSucursales();

  const [filterText, setFilterText] = useState('');

  // Estados para los modales y para los registros a editar/ver
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [sucursalEditar, setSucursalEditar] = useState(null);
  const [sucursalVer, setSucursalVer] = useState(null);

  // Filtrado de registros según el buscador (se busca en nombre, dirección y estado formateado)
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

  // Definimos las columnas del DataTable
  const columns = [
    {
      name: 'Sucursal',
      selector: row => row.nombre,
      sortable: true,
      grow: 2,
    },
    {
      name: 'Dirección',
      selector: row => row.direccion,
      sortable: true,
      grow: 3,
    },
    {
      name: 'Estado',
      // Se usa el componente EstadoIndicador para mostrar la etiqueta y el punto
      cell: row => <EstadoIndicador estado={row.estado} />,
      sortable: true,
      width: '120px',
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
              // Obtenemos el token CSRF del meta tag
              const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
              eliminarSucursal(row.id, token);
            }}
          />
        </div>
      ),
      width: '220px',
    },
  ];

  // Callback para actualizar la lista tras la creación
  const handleSucursalCreated = useCallback(async () => {
    await loadSucursales();
  }, [loadSucursales]);

  return (
    <MainLayout>
      <div className="container mx-auto p-6 bg-white shadow-lg rounded-lg">
        {/* Título y botón de creación */}
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

        {/* Buscador */}
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

        {/* DataTable con datos filtrados */}
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

        {/* Modales */}
        <CreateModal
          isOpen={isCreateOpen}
          onClose={() => {
            // Al cerrar, opcionalmente puedes limpiar cualquier estado en tu formulario si es necesario
            setIsCreateOpen(false);
          }}
          // Se pasa la función de callback para recargar la lista cuando se crea una sucursal
          onCreated={handleSucursalCreated}
          // Se pasa la función crearSucursal para el modal
          crearSucursal={crearSucursal}
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
