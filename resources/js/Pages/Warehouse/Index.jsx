import React, { useState, useMemo } from 'react';
import MainLayout from '@/Layouts/MainLayout'; 
import DataTable from 'react-data-table-component';
import IconButton from '@/Components/ui/IconButton';
import { Eye, Search } from 'lucide-react';
import { Input } from '@/Components/ui/input'; // Ajusta si tu input está en otra ruta

import { useWarehouseDocuments } from './hooks/useWarehouseDocuments';
import { customStyles } from './styles/tableStyles'; // Si usas estilos personalizados
import ViewModal from './components/ViewModal';

const WarehouseIndex = () => {
  // Hook para obtener la lista de documentos
  const { documents, loading } = useWarehouseDocuments();

  // Estado para el texto del buscador
  const [filterText, setFilterText] = useState('');

  // Estado para controlar el modal de “Ver”
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [docVer, setDocVer] = useState(null);

  // Filtrado de documentos (useMemo para performance)
  const filteredItems = useMemo(() => {
    return documents.filter(doc => {
      const fecha = doc.fecha?.toLowerCase() || '';
      const tipoMov = doc.tipo_movimiento?.toLowerCase() || '';
      const operacion = doc.operacion?.descripcion?.toLowerCase() || '';
      const usuario = doc.user?.name?.toLowerCase() || '';
      const texto = filterText.toLowerCase();

      return (
        fecha.includes(texto) ||
        tipoMov.includes(texto) ||
        operacion.includes(texto) ||
        usuario.includes(texto)
      );
    });
  }, [documents, filterText]);

  // Definimos las columnas de la tabla
  const columns = [
    {
      name: 'Fecha',
      selector: row => row.fecha,
      sortable: true,
      grow: 2,
    },
    {
      name: 'Tipo Mov.',
      selector: row => row.tipo_movimiento,
      sortable: true,
      width: '150px',
    },
    {
      name: 'Operación',
      selector: row => row.operacion?.descripcion || '-',
      sortable: true,
      grow: 2,
    },
    {
      name: 'Usuario',
      selector: row => row.user?.name || '-',
      sortable: true,
      grow: 2,
    },
    {
      name: 'Acciones',
      cell: row => (
        <IconButton
          icon={Eye}
          label="Ver"
          variant="info"
          size="sm"
          onClick={() => {
            setDocVer(row);
            setIsViewOpen(true);
          }}
        />
      ),
      width: '120px',
    },
  ];

  return (
    <MainLayout>
      <div className="container mx-auto p-6 bg-white shadow-lg rounded-lg">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Warehouse Documents</h1>
        </div>

        {/* Search Filter */}
        <div className="mb-4 relative">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Buscar documentos..."
              value={filterText}
              onChange={e => setFilterText(e.target.value)}
              className="pl-8 w-full md:w-96"
            />
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredItems}
          customStyles={customStyles}
          pagination
          progressPending={loading}
          progressComponent={<div className="text-center p-4">Cargando documentos...</div>}
          noDataComponent={<div className="text-center p-4">No hay documentos registrados.</div>}
          highlightOnHover
          pointerOnHover
        />

        {/* Solo modal de vista */}
        <ViewModal
          isOpen={isViewOpen}
          onClose={() => setIsViewOpen(false)}
          documento={docVer}
        />
      </div>
    </MainLayout>
  );
};

export default WarehouseIndex;
