import React, { useState } from 'react';
import MainLayout from '@/Layouts/MainLayout';
import DataTable from 'react-data-table-component';
import { useListaPrecios } from './hooks/useListaPrecios';
import CreateModal from './components/CreateModal';
import ViewAndEditModal from './components/ViewAndEditModal';
import tableStyles from './styles/tableStyles';

// Íconos (lucide-react) para "Ver/Editar" y "Desactivar"
import { Eye, Trash2 } from 'lucide-react';

// Tu componente para mostrar estado
import EstadoIndicador from '@/Components/ui/EstadoIndicador';

const ListaPreciosIndex = () => {
  const { listas, loading, desactivarLista, loadListas } = useListaPrecios();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [listaViewId, setListaViewId] = useState(null);

  const columns = [
    {
      name: 'Nombre',
      selector: row => row.nombre,
      sortable: true,
      grow: 2
    },
    {
      name: 'Fecha Creación',
      selector: row => new Date(row.created_at).toLocaleDateString(),
      width: '150px'
    },
    {
      name: 'Estado',
      // Aquí usamos el componente EstadoIndicador
      cell: row => <EstadoIndicador estado={row.estado} />,
      width: '150px'
    },
    {
      name: 'Acciones',
      cell: row => (
        <div className="flex gap-2">
          {/* Botón para ver/editar */}
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded flex items-center justify-center"
            onClick={() => {
              setListaViewId(row.id);
              setIsViewOpen(true);
            }}
            title="Ver/Editar"
          >
            <Eye size={16} />
          </button>

          {/* Botón para desactivar (solo si está activa) */}
          {row.estado === 1 && (
            <button
              className="bg-red-500 hover:bg-red-600 text-white p-2 rounded flex items-center justify-center"
              onClick={() => desactivarLista(row.id)}
              title="Desactivar"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      ),
      width: '120px'
    }
  ];

  return (
    <MainLayout>
      <div className="container mx-auto p-6 bg-white shadow-lg rounded-lg">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Listas de Precios</h1>
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition"
            onClick={() => setIsCreateOpen(true)}
          >
            Crear Lista de Precios
          </button>
        </div>

        <DataTable
          columns={columns}
          data={listas}
          customStyles={tableStyles}
          progressPending={loading}
          progressComponent={<div className="p-4">Cargando listas...</div>}
          noDataComponent={<div className="p-4">No hay listas registradas.</div>}
          pagination
          highlightOnHover
          pointerOnHover
        />

        {/* Modal para crear */}
        <CreateModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onCreated={() => {
            loadListas();
            setIsCreateOpen(false);
          }}
        />

        {/* Modal para ver/editar */}
        <ViewAndEditModal
          isOpen={isViewOpen}
          onClose={() => setIsViewOpen(false)}
          listaPreciosId={listaViewId}
        />
      </div>
    </MainLayout>
  );
};

export default ListaPreciosIndex;
