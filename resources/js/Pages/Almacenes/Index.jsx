import React, { useState, useMemo } from 'react';
import MainLayout from '@/Layouts/MainLayout';
import DataTable from 'react-data-table-component';
import IconButton from '@/Components/ui/IconButton';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Eye, Trash2, Search } from 'lucide-react';
import { useAlmacenes } from './hooks/useAlmacenes';
import { CreateModal } from './components/CreateModal';
import { EditModal } from './components/EditModal';
import { customStyles } from './styles/tableStyles';

const AlmacenesIndex = () => {
  const {
    almacenes,
    loading,
    isCrearModalOpen,
    setIsCrearModalOpen,
    isEditarModalOpen,
    setIsEditarModalOpen,
    almacenEditar,
    setAlmacenEditar,
    crearAlmacen,
    actualizarAlmacen,
    eliminarAlmacen,
  } = useAlmacenes();

  // Estado para el buscador
  const [filterText, setFilterText] = useState('');

  // Filtrar datos
  const filteredData = useMemo(() => {
    if (!filterText) return almacenes;
    
    return almacenes.filter(almacen => {
      const searchText = filterText.toLowerCase();
      return (
        almacen.nombre.toLowerCase().includes(searchText) ||
        almacen.ubicacion.toLowerCase().includes(searchText)
      );
    });
  }, [almacenes, filterText]);

  // Definimos columnas
  const columns = [
    {
      name: 'Nombre',
      selector: row => row.nombre,
      sortable: true
    },
    {
      name: 'Ubicación',
      selector: row => row.ubicacion,
      sortable: true
    },
    {
      name: 'Acciones',
      cell: row => (
        <div className="flex gap-2">
          <IconButton
            icon={Edit}
            label="Editar"
            variant="warning"
            size="sm"
            onClick={() => {
              setAlmacenEditar(row);
              setIsEditarModalOpen(true);
            }}
          />
          <IconButton
            icon={Trash2}
            label="Eliminar"
            variant="danger"
            size="sm"
            onClick={() => eliminarAlmacen(row.id)}
          />
        </div>
      ),
      width: '200px'
    }
  ];

  // Componente para el buscador
  const SearchComponent = () => (
    <div className="mb-4">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="text"
          placeholder="Buscar almacenes..."
          value={filterText}
          onChange={e => setFilterText(e.target.value)}
          className="pl-10 w-full"
        />
        {filterText && (
          <button
            onClick={() => setFilterText('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );

  return (
    <MainLayout>
      <div className="container mx-auto p-6 bg-white shadow-lg rounded-lg">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Almacenes</h1>
          <IconButton
            icon={Plus}
            label="Crear Almacén"
            variant="primary"
            size="md"
            onClick={() => setIsCrearModalOpen(true)}
          />
        </div>

        <SearchComponent />

        <DataTable
          columns={columns}
          data={filteredData}
          customStyles={customStyles}
          pagination
          progressPending={loading}
          progressComponent={<div className="text-center p-4">Cargando almacenes...</div>}
          noDataComponent={<div className="text-center p-4">No hay almacenes registrados.</div>}
          highlightOnHover
          pointerOnHover
        />

        {/* Modal Crear */}
        <CreateModal
          isOpen={isCrearModalOpen}
          onClose={() => setIsCrearModalOpen(false)}
          onSubmit={crearAlmacen}
        />

        {/* Modal Editar */}
        <EditModal
          isOpen={isEditarModalOpen}
          onClose={() => setIsEditarModalOpen(false)}
          almacen={almacenEditar}
          onSubmit={actualizarAlmacen}
        />
      </div>
    </MainLayout>
  );
};

export default AlmacenesIndex;