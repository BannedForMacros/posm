import React, { useState } from 'react';
import MainLayout from '@/Layouts/MainLayout';
import DataTable from 'react-data-table-component';
import IconButton from '@/Components/ui/IconButton';
import { Plus, Eye, Edit, Trash2 } from 'lucide-react';
import { customStyles } from './styles/tableStyles';
import { useCompras } from './hooks/useCompras';

import CreateModal from './components/CreateModal';
import EditModal from './components/EditModal';
import ViewModal from './components/ViewModal';

const ComprasIndex = () => {
  // Extraemos datos y funciones del hook
  const { facturaciones, loading, eliminarCompra, loadFacturaciones } = useCompras();
  

  // Control de modales
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [compraEditar, setCompraEditar] = useState(null);

  const [isViewOpen, setIsViewOpen] = useState(false);
  const [compraView, setCompraView] = useState(null);

  // Columnas: Fecha, Proveedor, Valor Compra, Acciones
  const columns = [
    {
      name: 'Fecha',
      selector: row => {
        if (!row.fecha) return 'Sin fecha';
        const fecha = new Date(row.fecha);
        return fecha.toLocaleDateString();
      },
      sortable: true,
      width: '150px',
    },
    {
      name: 'Proveedor',
      selector: row => row.nombre_proveedor || 'N/A', 
      sortable: true,
      grow: 2,
    },
    {
      name: 'Valor Compra',
      selector: row => row.valor_compra,
      sortable: true,
      right: true,
      cell: row => `S/ ${parseFloat(row.valor_compra || 0).toFixed(2)}`,
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
              setCompraView(row);
              setIsViewOpen(true);
            }}
          />
          <IconButton
            icon={Edit}
            label="Editar"
            variant="warning"
            size="sm"
            onClick={() => {
              setCompraEditar(row);
              setIsEditOpen(true);
            }}
          />
          <IconButton
            icon={Trash2}
            label="Eliminar"
            variant="danger"
            size="sm"
            onClick={() => eliminarCompra(row.id)}
          />
        </div>
      ),
      width: '180px',
      right: true
    }
  ];

  return (
    <MainLayout>
      <div className="container mx-auto p-6 bg-white shadow-lg rounded-lg">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Gestión de Compras</h1>
          <IconButton
            icon={Plus}
            label="Crear Compra"
            variant="primary"
            size="md"
            onClick={() => setIsCreateOpen(true)}
          />
        </div>

        <DataTable
          columns={columns}
          data={facturaciones}
          customStyles={customStyles}
          pagination
          progressPending={loading}
          progressComponent={<div className="text-center p-4">Cargando compras...</div>}
          noDataComponent={<div className="text-center p-4">No hay compras registradas.</div>}
          highlightOnHover
          pointerOnHover
        />

        {/* Modal Crear */}
        <CreateModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          // Cuando se cree una compra con éxito, recargamos la tabla sin refrescar
          onCreated={() => {
            loadFacturaciones();
            setIsCreateOpen(false);
          }}
        />

        {/* Modal Editar */}
        <EditModal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          compra={compraEditar}
        />

        {/* Modal Ver */}
        <ViewModal
          isOpen={isViewOpen}
          onClose={() => setIsViewOpen(false)}
          compra={compraView}
        />
      </div>
    </MainLayout>
  );
};

export default ComprasIndex;
