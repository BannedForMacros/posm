import React from 'react';
import MainLayout from '@/Layouts/MainLayout';
import DataTable from 'react-data-table-component';
import IconButton from '@/Components/ui/IconButton';
import EstadoIndicador from '@/Components/ui/EstadoIndicador';
import { Plus, Edit, Eye, Trash2 } from 'lucide-react';
import { useFamilias } from './hooks/useFamilias';
import { CreateModal } from './components/CreateModal';
import { EditModal } from './components/EditModal';
import { customStyles } from './styles/tableStyles';

const Familias = () => {
  const {
    familias,
    loading,
    isCrearModalOpen,
    isEditarModalOpen,
    familiaEditar,
    soloVer,
    nuevaFamilia,
    setIsCrearModalOpen,
    setIsEditarModalOpen,
    setFamiliaEditar,
    setSoloVer,
    setNuevaFamilia,
    crearFamilia,
    actualizarFamilia,
    eliminarFamilia,
  } = useFamilias();

  const columns = [
    {
      name: 'Código',
      selector: (row) => row.codfamilia,
      sortable: true,
    },
    {
      name: 'Familia',
      selector: (row) => row.familia,
      sortable: true,
    },
    {
      name: 'Subfamilia',
      selector: (row) => row.subfamilia,
      sortable: true,
    },
    {
        name: 'Estado',
        cell: (row) => <EstadoIndicador estado={row.estado} />,
        sortable: true,
        center: true,
    },
    {
      name: 'Acciones',
      cell: (row) => (
        <div className="flex gap-2">
          <IconButton
            icon={Eye}
            label="Ver"
            variant="info"
            size="sm"
            onClick={() => {
              setFamiliaEditar(row);
              setSoloVer(true);
              setIsEditarModalOpen(true);
            }}
          />
          <IconButton
            icon={Edit}
            label="Editar"
            variant="warning"
            size="sm"
            onClick={() => {
              setFamiliaEditar(row);
              setSoloVer(false);
              setIsEditarModalOpen(true);
            }}
          />
          <IconButton
            icon={Trash2}
            label="Eliminar"
            variant="danger"
            size="sm"
            onClick={() => eliminarFamilia(row.codfamilia)}
          />
        </div>
      ),
    },
  ];

  return (
    <MainLayout>
      <div className="container mx-auto p-6 bg-white shadow-lg rounded-lg">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Familias</h1>
          <IconButton
            icon={Plus}
            label="Crear Familia"
            variant="primary"
            size="md"
            onClick={() => setIsCrearModalOpen(true)}
          />
        </div>

        <DataTable
          columns={columns}
          data={familias}
          customStyles={customStyles}
          pagination
          progressPending={loading}
          progressComponent={<div className="text-center p-4">Cargando familias...</div>}
          noDataComponent={<div className="text-center p-4">No hay familias registradas.</div>}
          highlightOnHover
          pointerOnHover
        />

        <CreateModal
          isOpen={isCrearModalOpen}
          onClose={() => setIsCrearModalOpen(false)}
          nuevaFamilia={nuevaFamilia}
          setNuevaFamilia={setNuevaFamilia}
          onSubmit={() => crearFamilia(nuevaFamilia)}
        />

        <EditModal
          isOpen={isEditarModalOpen}
          onClose={() => setIsEditarModalOpen(false)}
          familia={familiaEditar}
          setFamilia={setFamiliaEditar}
          onSubmit={() => actualizarFamilia(familiaEditar)}
          soloVer={soloVer}
        />
      </div>
    </MainLayout>
  );
};

export default Familias;