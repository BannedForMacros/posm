import React, { useState, useMemo } from 'react';
import MainLayout from '@/Layouts/MainLayout';
import DataTable from 'react-data-table-component';
import IconButton from '@/Components/ui/IconButton';
import { Plus, Eye, Edit, Trash2, Search } from 'lucide-react';
import { customStyles } from './styles/tableStyles';
import { useCompras } from './hooks/useCompras';

import CreateModal from './components/CreateModal';
import EditModal from './components/EditModal';
import ViewModal from './components/ViewModal';

export default function Index() {
  const { facturaciones, loading, eliminarCompra, loadFacturaciones } = useCompras();

  // Control de modales
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [compraEditar, setCompraEditar] = useState(null);

  const [isViewOpen, setIsViewOpen] = useState(false);
  const [compraView, setCompraView] = useState(null);

  // Texto de búsqueda global
  const [searchText, setSearchText] = useState('');

  /**
   * Filtrado en memoria de los datos:
   * Convertimos todos los campos relevantes (fecha, proveedor, RUC, serie, doc, valor_compra)
   * a un string, y verificamos si incluye el texto buscado.
   */
  const filteredFacturaciones = useMemo(() => {
    const lowerSearch = searchText.toLowerCase();

    return facturaciones.filter((row) => {
      // Fecha como string local (fecha + hora)
      let fechaStr = '';
      if (row.fecha) {
        const fechaObj = new Date(row.fecha);
        fechaStr = fechaObj.toLocaleString('es-PE').toLowerCase(); 
        // Ej: "12/03/23 10:15 a. m."
      }

      const provName = (row.nombre_proveedor || '').toLowerCase();
      const provRuc  = (row.ruc_proveedor || '').toLowerCase();
      const serie    = row.num_serie ? String(row.num_serie).toLowerCase() : '';
      const numero   = row.num_documento ? String(row.num_documento).toLowerCase() : '';
      const valor    = row.valor_compra ? String(row.valor_compra).toLowerCase() : '';

      // Unimos todo en un solo string
      const combined = [
        fechaStr, 
        provName, 
        provRuc, 
        serie, 
        numero, 
        valor
      ].join(' ');

      return combined.includes(lowerSearch);
    });
  }, [facturaciones, searchText]);

  // Columnas
  const columns = [
    {
      name: 'Fecha',
      cell: row => {
        if (!row.fecha) return 'Sin fecha';
        const fechaObj = new Date(row.fecha);

        const fecha = fechaObj.toLocaleDateString('es-PE', {
          day: '2-digit',
          month: '2-digit',
          year: '2-digit'
        });
        const hora = fechaObj.toLocaleTimeString('es-PE', {
          hour: '2-digit',
          minute: '2-digit'
        });

        return (
          <div>
            <div>{fecha}</div>
            <div className="text-xs text-gray-500">{hora}</div>
          </div>
        );
      },
      width: '110px',
      sortable: true,
    },
    {
      name: 'Comprobante',
      cell: row => {
        const serie = row.num_serie || '---';
        const numero = row.num_documento || '---';
        return (
          <div className="font-medium">
            {serie} - {numero}
          </div>
        );
      },
      width: '140px',
      sortable: true,
    },
    {
      name: 'Proveedor',
      cell: row => {
        const nombre = row.nombre_proveedor || 'N/A';
        const ruc = row.ruc_proveedor || '---';
        return (
          <div>
            <div className="font-medium">{nombre}</div>
            <div className="text-xs text-gray-500">{ruc}</div>
          </div>
        );
      },
      grow: 2,
      sortable: true,
    },
    {
      // Aumentamos el width para que quepa "Valor Compra"
      name: 'Valor Compra',
      cell: row => {
        const valor = parseFloat(row.valor_compra || 0).toFixed(2);
        return <div className="text-right">S/ {valor}</div>;
      },
      width: '160px', // más ancho para no truncar
      right: true,
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
      right: true,
    }
  ];

  // Subheader con el input de búsqueda, alineado a la izquierda
  const SubHeaderComponent = (
    <div className="w-full flex items-center justify-start gap-2">
      <div className="relative">
        <Search className="absolute left-2 top-2 text-gray-400" size={18} />
        <input
          type="text"
          className="border rounded pl-8 pr-2 py-1"
          placeholder="Buscar por fecha, RUC, proveedor, serie..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>
    </div>
  );

  return (
    <MainLayout>
      <div className="container mx-auto p-6 bg-white shadow-lg rounded-lg">
        {/* Encabezado principal */}
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
          data={filteredFacturaciones}      
          customStyles={customStyles}
          pagination
          progressPending={loading}
          progressComponent={<div className="text-center p-4">Cargando compras...</div>}
          noDataComponent={<div className="text-center p-4">No hay compras registradas.</div>}
          highlightOnHover
          pointerOnHover

          subHeader
          subHeaderComponent={SubHeaderComponent}
        />

        {/* Modal Crear */}
        <CreateModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
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
}
