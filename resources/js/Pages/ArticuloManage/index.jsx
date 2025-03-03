import React from 'react';
import MainLayout from '@/Layouts/MainLayout';
import DataTable from 'react-data-table-component';
import IconButton from '@/Components/ui/IconButton';
import EstadoIndicador from '@/Components/ui/EstadoIndicador';
import { Plus, Edit, Eye, Trash2 } from 'lucide-react';
import { useArticulos } from './hooks/useArticulos';
import { CreateModal } from './components/CreateModal';
import { EditModal } from './components/EditModal';
import { ViewModal } from './components/ViewModal';
import { customStyles } from './styles/tableStyles';

const ArticulosManage = () => {
  const {
    articulos,
    loading,
    isCrearModalOpen,
    isEditarModalOpen,
    isViewModalOpen,
    articuloEditar,
    articuloView,
    nuevoArticulo,
    setIsCrearModalOpen,
    setIsEditarModalOpen,
    setIsViewModalOpen,
    setArticuloEditar,
    setArticuloView,
    setNuevoArticulo,
    crearArticulo,
    actualizarArticulo,
    eliminarArticulo
  } = useArticulos();

  const columns = [
    {
      name: 'Código',
      selector: row => row.codarticulo,
      sortable: true,
    },
    {
      name: 'Familia',
      selector: row => row.codfamilia,
      sortable: true,
    },
    {
      name: 'Nombre',
      selector: row => row.nombrearticulo,
      sortable: true,
    },
    {
      name: 'Estado',
      cell: row => <EstadoIndicador estado={row.estado} />,
      sortable: true,
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
              setArticuloView(row);
              setIsViewModalOpen(true);
            }}
          />
          <IconButton
            icon={Edit}
            label="Editar"
            variant="warning"
            size="sm"
            onClick={() => {
              setArticuloEditar(row);
              setIsEditarModalOpen(true);
            }}
          />
          <IconButton
            icon={Trash2}
            label="Eliminar"
            variant="danger"
            size="sm"
            onClick={() => eliminarArticulo(row.codarticulo)}
          />
        </div>
      ),
    },
  ];

  return (
    <MainLayout>
      <div className="container mx-auto p-6 bg-white shadow-lg rounded-lg">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Gestión de Artículos</h1>
          <IconButton
            icon={Plus}
            label="Crear Artículo"
            variant="primary"
            size="md"
            onClick={() => setIsCrearModalOpen(true)}
          />
        </div>

        <DataTable
          columns={columns}
          data={articulos}
          customStyles={customStyles}
          pagination
          progressPending={loading}
          progressComponent={<div className="text-center p-4">Cargando artículos...</div>}
          noDataComponent={<div className="text-center p-4">No hay artículos registrados.</div>}
          highlightOnHover
          pointerOnHover
        />

        <CreateModal
          isOpen={isCrearModalOpen}
          onClose={() => setIsCrearModalOpen(false)}
          nuevoArticulo={nuevoArticulo}
          setNuevoArticulo={setNuevoArticulo}
          onSubmit={() => crearArticulo(nuevoArticulo)}
        />

        <EditModal
          isOpen={isEditarModalOpen}
          onClose={() => setIsEditarModalOpen(false)}
          articulo={articuloEditar}
          setArticulo={setArticuloEditar}
          onSubmit={() => actualizarArticulo(articuloEditar)}
        />

        <ViewModal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          articulo={articuloView}
        />
      </div>
    </MainLayout>
  );
};

export default ArticulosManage;