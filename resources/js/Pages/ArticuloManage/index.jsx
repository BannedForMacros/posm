import React, { useState, useMemo } from 'react';
import MainLayout from '@/Layouts/MainLayout';
import DataTable from 'react-data-table-component';
import IconButton from '@/Components/ui/IconButton';
import EstadoIndicador from '@/Components/ui/EstadoIndicador';
import { Plus, Edit, Eye, Trash2 } from 'lucide-react';
import { useArticulos } from './hooks/useArticulos'; // Tu custom hook
import { CreateModal } from './components/CreateModal';
import { EditModal } from './components/EditModal';
import { ViewModal } from './components/ViewModal';
import { customStyles } from './styles/tableStyles';
import { usePage } from '@inertiajs/react';

const ArticulosManage = () => {
  // 1) Obtenemos props desde la página (vía Inertia)
  const { familias = [] } = usePage().props;

  // 2) Custom hook con la lógica de artículos
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

  // 3) Definimos estado local para el término de búsqueda
  const [searchTerm, setSearchTerm] = useState('');

  // 4) Filtramos los artículos en tiempo real
  //    Buscamos por codarticulo o nombrearticulo, ajusta según tu preferencia
  const filteredArticulos = useMemo(() => {
    if (!searchTerm) return articulos;
    const lowerSearch = searchTerm.toLowerCase();
    return articulos.filter((art) => {
      const code = (art.codarticulo ?? '').toString().toLowerCase();
      const name = (art.nombrearticulo ?? '').toLowerCase();
      return code.includes(lowerSearch) || name.includes(lowerSearch);
    });
  }, [articulos, searchTerm]);

  // 5) Definimos las columnas para DataTable
  const columns = [
    {
      name: 'Código',
      selector: row => row.codarticulo,
      sortable: true,
    },
    {
      name: 'Familia',
      selector: row => row.codfamilia,
      // Podrías mostrar row.familia?.familia si tienes la relación cargada
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
        {/* Encabezado */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h1 className="text-3xl font-bold text-gray-800">Gestión de Artículos</h1>

          {/* Campo de Búsqueda */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              className="px-3 py-2 border rounded-md text-sm"
              placeholder="Buscar artículo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <IconButton
              icon={Plus}
              label="Crear Artículo"
              variant="primary"
              size="md"
              onClick={() => setIsCrearModalOpen(true)}
            />
          </div>
        </div>

        {/* DataTable de artículos */}
        <DataTable
          columns={columns}
          // En lugar de data={articulos}, usamos data={filteredArticulos}
          data={filteredArticulos}
          customStyles={customStyles}
          progressPending={loading}
          progressComponent={<div className="text-center p-4">Cargando artículos...</div>}
          noDataComponent={<div className="text-center p-4">No hay artículos registrados.</div>}
          highlightOnHover
          pointerOnHover
        />

        {/* Modal de Crear Artículo */}
        <CreateModal
          isOpen={isCrearModalOpen}
          onClose={() => setIsCrearModalOpen(false)}
          nuevoArticulo={nuevoArticulo}
          setNuevoArticulo={setNuevoArticulo}
          onSubmit={() => crearArticulo(nuevoArticulo)}
          familias={familias}
        />

        {/* Modal de Editar Artículo */}
        <EditModal
          isOpen={isEditarModalOpen}
          onClose={() => setIsEditarModalOpen(false)}
          articulo={articuloEditar}
          setArticulo={setArticuloEditar}
          onSubmit={() => actualizarArticulo(articuloEditar)}
        />

        {/* Modal de Ver Artículo */}
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
