import React, { useState, useEffect } from 'react';
import MainLayout from '@/Layouts/MainLayout';
import DataTable from 'react-data-table-component';
import IconButton from '@/Components/ui/IconButton';
import Modal from '@/Components/ui/Modal';
import { FileText, Search, X } from 'lucide-react';

const customStyles = {
  headRow: {
    style: {
      backgroundColor: '#333',
      color: '#fff',
      fontSize: '18px',
      fontWeight: 'bold',
      borderTopLeftRadius: '12px',
      borderTopRightRadius: '12px',
    },
  },
  headCells: {
    style: {
      fontSize: '16px',
      fontWeight: 'bold',
      color: '#fff',
      backgroundColor: '#444',
      padding: '12px',
    },
  },
  rows: {
    style: {
      borderBottom: '1px solid #ddd',
      fontSize: '14px',
      '&:hover': {
        backgroundColor: '#f5f5f5',
      },
    },
  },
  cells: {
    style: {
      padding: '12px',
    },
  },
};

const Ventas = () => {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVenta, setSelectedVenta] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [resetPaginationToggle, setResetPaginationToggle] = useState(false);

  useEffect(() => {
    fetchVentas();
  }, []);

  const fetchVentas = async () => {
    try {
      const response = await fetch('/api/ventas', {
        headers: { 'Accept': 'application/json' }
      });
      const data = await response.json();
      setVentas(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShowVentaCompleta = async (venta) => {
    setSelectedVenta(venta);
    setIsModalOpen(true);
    setLoadingDetails(true);

    try {
      const [detallesResponse, formasPagoResponse] = await Promise.all([
        fetch(`/api/ventas/detalles/${venta.COD_DOCUMENTO}/${venta.SERI_VENTA}/${venta.NUME_VENTA}`, {
          headers: { 'Accept': 'application/json' }
        }),
        fetch(`/api/ventas/formas-pago/${venta.COD_DOCUMENTO}/${venta.SERI_VENTA}/${venta.NUME_VENTA}`, {
          headers: { 'Accept': 'application/json' }
        })
      ]);

      const [detalles, formasPago] = await Promise.all([
        detallesResponse.json(),
        formasPagoResponse.json()
      ]);

      setSelectedVenta(prev => ({
        ...prev,
        detalles,
        formasPago
      }));
    } catch (error) {
      console.error('Error:', error);
      alert('Error al cargar los detalles');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleFilterChange = (e) => {
    const value = e.target.value;
    setFilterText(value);
    setResetPaginationToggle(!resetPaginationToggle);
  };

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
            onChange={handleFilterChange}
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
          onChange={e => setSelectedMonth(e.target.value)}
        >
          <option value="">Todos los meses</option>
          {[
            "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
            "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
          ].map((mes, index) => (
            <option key={index + 1} value={index + 1}>{mes}</option>
          ))}
        </select>

        <select
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 min-w-[180px]"
          value={selectedYear}
          onChange={e => setSelectedYear(e.target.value)}
        >
          <option value="">Todos los años</option>
          {Array.from({ length: 5 }, (_, i) => {
            const year = new Date().getFullYear() - i;
            return (
              <option key={year} value={year}>{year}</option>
            );
          })}
        </select>
      </div>
    </div>
  ), [filterText, selectedMonth, selectedYear, resetPaginationToggle]);

  const columns = [
    {
      name: 'Comprobante',
      selector: row => `${row.COD_DOCUMENTO}-${row.SERI_VENTA}-${row.NUME_VENTA}`,
      sortable: true,
      width: '200px',
      cell: row => (
        <div className="font-medium">
          {row.COD_DOCUMENTO}-{row.SERI_VENTA}-{row.NUME_VENTA}
        </div>
      ),
    },
    {
      name: 'Cliente',
      selector: row => row.RAZONSOCIALCLI || 'Cliente no registrado',
      sortable: true,
      grow: 2,
      cell: row => (
        <div>
          <div className="font-medium">{row.RAZONSOCIALCLI || 'Cliente no registrado'}</div>
          <div className="text-xs text-gray-500">
            {row.TIPODOCUMENTOCLI}: {row.NUMERODOCUMENTOCLI}
          </div>
        </div>
      ),
    },
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
      name: 'Total',
      selector: row => row.TOTAL_VENTA,
      sortable: true,
      right: true,
      width: '120px',
      cell: row => (
        <div className="font-medium text-right">
          S/ {parseFloat(row.TOTAL_VENTA).toFixed(2)}
        </div>
      ),
    },
    {
      name: 'Acciones',
      cell: row => (
        <IconButton
          icon={FileText}
          label="Ver Detalle Completo"
          variant="info"
          size="sm"
          onClick={() => handleShowVentaCompleta(row)}
        />
      ),
      width: '120px',
      right: true,
    },
  ];

  return (
    <MainLayout>
      <div className="container mx-auto p-6">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <h1 className="text-3xl font-bold mb-6 text-gray-800 text-center pt-6">Mis Ventas</h1>
          
          <DataTable
            columns={columns}
            data={filteredItems}
            customStyles={customStyles}
            pagination
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

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={selectedVenta ? `Detalle de Venta - ${selectedVenta.COD_DOCUMENTO}-${selectedVenta.SERI_VENTA}-${selectedVenta.NUME_VENTA}` : ''}
        >
          {loadingDetails ? (
            <div className="flex justify-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : selectedVenta ? (
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-bold text-lg mb-4">Información General</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p><strong>Cliente:</strong> {selectedVenta.RAZONSOCIALCLI}</p>
                    <p><strong>Documento:</strong> {selectedVenta.NUMERODOCUMENTOCLI}</p>
                  </div>
                  <div>
                    <p><strong>Fecha:</strong> {new Date(selectedVenta.FEMI_VENTA).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: '2-digit',
                      year: '2-digit'
                    })}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg">Detalles de la Venta</h3>
                  <p className="font-bold text-lg">
                    Total: S/ {parseFloat(selectedVenta.TOTAL_VENTA).toFixed(2)}
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="bg-gray-200">
                        <th className="px-4 py-2 text-left">Artículo</th>
                        <th className="px-4 py-2 text-right">Cantidad</th>
                        <th className="px-4 py-2 text-right">P.Unit</th>
                        <th className="px-4 py-2 text-right">SubTotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedVenta.detalles?.map((detalle, index) => {
                        const subtotal = parseFloat(detalle.CANT_VENTASD) * parseFloat(detalle.PUNI_VENTASD);
                        return (
                          <tr key={index} className="border-b">
                            <td className="px-4 py-2">{detalle.nombrearticulo || detalle.NOMBREARTICULO || 'Sin nombre'}</td>
                            <td className="px-4 py-2 text-right">{parseFloat(detalle.CANT_VENTASD).toFixed(2)}</td>
                            <td className="px-4 py-2 text-right">S/ {parseFloat(detalle.PUNI_VENTASD).toFixed(2)}</td>
                            <td className="px-4 py-2 text-right">S/ {subtotal.toFixed(2)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-bold text-lg mb-4">Formas de Pago</h3>
                <div className="space-y-2">
                  {selectedVenta.formasPago?.map((forma, index) => (
                    <div key={index} className="grid grid-cols-2 gap-4 p-2 border-b">
                      <p><strong>Tipo:</strong> {forma.REFE_FORMAP}</p>
                      <p><strong>Monto:</strong> S/ {parseFloat(forma.TMONT_FORMAP).toFixed(2)}</p>
                      {forma.NUM_FORMAP && (
                        <p><strong>Número:</strong> {forma.NUM_FORMAP}</p>
                      )}
                      {forma.CODTARJETA && (
                        <p><strong>Tarjeta:</strong> {forma.CODTARJETA}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-500">No hay información disponible</p>
          )}
        </Modal>
      </div>
    </MainLayout>
  );
};

export default Ventas;