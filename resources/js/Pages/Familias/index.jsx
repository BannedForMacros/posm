// src/Pages/Familias/index.jsx
import React, { useMemo, useState } from 'react';
import MainLayout from '@/Layouts/MainLayout';
import DataTable from 'react-data-table-component';
import IconButton from '@/Components/ui/IconButton';
import EstadoIndicador from '@/Components/ui/EstadoIndicador';
import { Plus, Eye, Trash2 } from 'lucide-react';
import { useFamilias } from './hooks/useFamilias';
import { CreateModal } from './components/CreateModal';
import ViewEditModal from './components/ViewEditModal';
import { customStyles } from './styles/tableStyles';

const Familias = () => {
  const {
    familias,
    loading,
    isCrearModalOpen,
    familiaEditar,
    nuevaFamilia,
    setIsCrearModalOpen,
    setFamiliaEditar,
    setNuevaFamilia,
    crearFamilia,
    actualizarFamilia,
    eliminarFamilia,
  } = useFamilias();

  // Estado para el buscador en tiempo real
  const [filterText, setFilterText] = useState('');

  // Filtra las familias (buscando en código, familia y subfamilia)
  const filteredFamilies = useMemo(() => {
    const lowerFilter = filterText.toLowerCase();
    return familias.filter((f) =>
      f.codfamilia.toLowerCase().includes(lowerFilter) ||
      f.familia.toLowerCase().includes(lowerFilter) ||
      (f.subfamilia && f.subfamilia.toLowerCase().includes(lowerFilter))
    );
  }, [familias, filterText]);

  // Deduplicar familias por nombre para el select del CreateModal
  const deduplicatedFamilies = useMemo(() => {
    const seen = new Set();
    return familias.filter((f) => {
      if (seen.has(f.familia)) {
        return false;
      } else {
        seen.add(f.familia);
        return true;
      }
    });
  }, [familias]);

  // Estado para controlar la apertura del modal combinado (ViewEditModal)
  const [isViewEditModalOpen, setIsViewEditModalOpen] = useState(false);

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
          {/* Botón para abrir el modal combinado (vista/edición) */}
          <IconButton
            icon={Eye}
            label="Ver"
            variant="info"
            size="sm"
            onClick={() => {
              setFamiliaEditar(row);
              setIsViewEditModalOpen(true);
            }}
          />
          {/* Botón para eliminar */}
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
        {/* Título y botón para crear nueva familia */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Familias</h1>
          <IconButton
            icon={Plus}
            label="Crear Familia"
            variant="primary"
            size="md"
            onClick={() => {
              setNuevaFamilia({ codfamilia: '', familia: '', subfamilia: '' });
              setIsCrearModalOpen(true);
            }}
          />
        </div>

        {/* Buscador en tiempo real con ancho 1/2 */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Buscar familias..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-1/2 px-4 py-2 border rounded"
          />
        </div>

        {/* DataTable */}
        <DataTable
          columns={columns}
          data={filteredFamilies}
          customStyles={customStyles}
          pagination
          progressPending={loading}
          progressComponent={<div className="text-center p-4">Cargando familias...</div>}
          noDataComponent={<div className="text-center p-4">No hay familias registradas.</div>}
          highlightOnHover
          pointerOnHover
        />

        {/* MODAL DE CREACIÓN */}
        <CreateModal
          isOpen={isCrearModalOpen}
          onClose={() => {
            setNuevaFamilia({ codfamilia: '', familia: '', subfamilia: '' });
            setIsCrearModalOpen(false);
          }}
          nuevaFamilia={nuevaFamilia}
          setNuevaFamilia={setNuevaFamilia}
          onSubmit={() => {
            crearFamilia(nuevaFamilia);
            setNuevaFamilia({ codfamilia: '', familia: '', subfamilia: '' });
          }}
          familias={deduplicatedFamilies}
        />

        {/* MODAL COMBINADO (VISTA / EDICIÓN) */}
        <ViewEditModal
          isOpen={isViewEditModalOpen}
          onClose={() => setIsViewEditModalOpen(false)}
          familia={familiaEditar}
          setFamilia={setFamiliaEditar}
          onSubmit={() => actualizarFamilia(familiaEditar)}
        />
      </div>
    </MainLayout>
  );
};

export default Familias;
