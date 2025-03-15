// resources/js/Pages/Ventas/index.jsx
import React, { useState } from 'react';
import MainLayout from '@/Layouts/MainLayout';
import DataTable from 'react-data-table-component';
import { customStyles } from './styles/tableStyles'; // tu archivo de estilos
import { useVentas } from './hooks/useVentas';        // tu hook
import IconButton from '@/Components/ui/IconButton';
import { FileText, Search, X, Plus } from 'lucide-react';

// Componentes
import CreateModal from './components/CreateModal';
import ViewModal from './components/ViewModal'; // para ver detalle de una venta

const VentasIndex = () => {
  const { ventas, loading, crearVenta, loadVentas } = useVentas();

  // Filtro
  const [filterText, setFilterText] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [resetPaginationToggle, setResetPaginationToggle] = useState(false);

  // Modal Crear
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Modal Ver
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [ventaView, setVentaView] = useState(null);

  // Lógica de filtrado
  const filteredItems = ventas.filter(item => {
    const searchText = filterText.toLowerCase();
    const matchesText = 
      `${item.COD_DOCUMENTO}-${item.SERI_VENTA}-${item.NUME_VENTA}`.toLowerCase().includes(searchText) ||
      (item.RAZONSOCIALCLI || '').toLowerCase().includes(searchText) ||
      (item.NUMERODOCUMENTOCLI || '').toLowerCase().includes(searchText);

    if (!matchesText) return false;

    if (selectedMonth || selectedYear) {
      const date = new Date(item.FEMI_VENTA);
      if (selectedMonth && (date.getMonth() + 1) !== parseInt(selectedMonth)) return false;
      if (selectedYear && date.getFullYear() !== parseInt(selectedYear)) return false;
    }

    return true;
  });

  // Columnas
  const columns = [
    {
      name: 'Fecha',
      selector: row => row.FEMI_VENTA,
      sortable: true,
      width: '150px',
      cell: row => {
        const fecha = new Date(row.FEMI_VENTA);
        return (
          <div>
            <div>{fecha.toLocaleDateString('es-ES', {
              day: '2-digit',
              month: '2-digit',
              year: '2-digit'
            })}</div>
            <div className="text-xs text-gray-500">{row.HORAEMISION}</div>
          </div>
        );
      },
    },
    {
      name: 'Comprobante',
      selector: row => `${row.COD_DOCUMENTO}-${row.SERI_VENTA}-${row.NUME_VENTA}`,
      sortable: true,
      width: '200px',
    },
    {
      name: 'Cliente',
      selector: row => row.RAZONSOCIALCLI || 'Cliente no registrado',
      sortable: true,
      grow: 2,
    },
    {
      name: 'Total',
      selector: row => row.TOTAL_VENTA,
      sortable: true,
      right: true,
      width: '120px',
      cell: row => `S/ ${parseFloat(row.TOTAL_VENTA || 0).toFixed(2)}`
    },
    {
      name: 'Acciones',
      cell: row => (
        <IconButton
          icon={FileText}
          label="Ver Detalle"
          variant="info"
          size="sm"
          onClick={() => {
            setVentaView(row);
            setIsViewOpen(true);
          }}
        />
      ),
      width: '120px',
      right: true,
    },
  ];

  // SubHeader (filtros)
  const SubHeaderComponent = React.useCallback(() => (
    <div className="w-full px-6">
      <div className="flex flex-row items-center gap-4 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Buscar por documento, cliente..."
            value={filterText}
            onChange={e => {
              setFilterText(e.target.value);
              setResetPaginationToggle(!resetPaginationToggle);
            }}
          />
          {filterText && (
            <button
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              onClick={() => {
                setFilterText('');
                setResetPaginationToggle(!resetPaginationToggle);
              }}
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <select
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 min-w-[180px]"
          value={selectedMonth}
          onChange={e => {
            setSelectedMonth(e.target.value);
            setResetPaginationToggle(!resetPaginationToggle);
          }}
        >
          <option value="">Todos los meses</option>
          {[
            "Enero","Febrero","Marzo","Abril","Mayo","Junio",
            "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
          ].map((mes, index) => (
            <option key={index+1} value={index+1}>{mes}</option>
          ))}
        </select>

        <select
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 min-w-[180px]"
          value={selectedYear}
          onChange={e => {
            setSelectedYear(e.target.value);
            setResetPaginationToggle(!resetPaginationToggle);
          }}
        >
          <option value="">Todos los años</option>
          {Array.from({ length: 5 }, (_, i) => {
            const year = new Date().getFullYear() - i;
            return <option key={year} value={year}>{year}</option>;
          })}
        </select>
      </div>
    </div>
  ), [filterText, selectedMonth, selectedYear, resetPaginationToggle]);

  return (
    <MainLayout>
      <div className="container mx-auto p-6">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">

          <div className="flex justify-between items-center p-6">
            <h1 className="text-3xl font-bold text-gray-800">Mis Ventas</h1>
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition flex items-center gap-2"
              onClick={() => setIsCreateOpen(true)}
            >
              <Plus size={18} />
              <span>Crear Venta</span>
            </button>
          </div>

          <DataTable
            columns={columns}
            data={filteredItems}
            customStyles={customStyles}
            paginationResetDefaultPage={resetPaginationToggle}
            progressPending={loading}
            progressComponent={<div className="text-center p-4">Cargando ventas...</div>}
            noDataComponent={<div className="text-center p-4">No se encontraron ventas.</div>}
            highlightOnHover
            pointerOnHover
            subHeader
            subHeaderComponent={<SubHeaderComponent />}
            persistTableHead
            responsive
          />
        </div>

        {/* Modal Crear */}
        <CreateModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          crearVentaFn={crearVenta} // pasamos la función del hook
          onCreated={() => {
            // recargamos la lista en onCreated, o en el hook
            loadVentas();
          }}
        />

        {/* Modal Ver Detalle */}
        <ViewModal
          isOpen={isViewOpen}
          onClose={() => setIsViewOpen(false)}
          venta={ventaView}
        />
      </div>
    </MainLayout>
  );
};

export default VentasIndex;
