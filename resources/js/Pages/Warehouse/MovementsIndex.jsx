import React, { useState, useEffect } from 'react';
import MainLayout from '@/Layouts/MainLayout';
import DataTable from 'react-data-table-component';
import IconButton from '@/Components/ui/IconButton';
import { Eye } from 'lucide-react';
import ViewDocModal from './components/ViewDocModal';

// Importamos nuestro nuevo <SelectWithSearchInDropdown>
import SelectWithSearchInDropdown from '@/Components/ui/SelectWithSearchInDropdown';

export default function MovementsIndex() {
  // Listas para selects
  const [almacenes, setAlmacenes] = useState([]);
  const [productos, setProductos] = useState([]);

  // Filtros
  const [almacenId, setAlmacenId] = useState('');
  const [productId, setProductId] = useState('');

  // Movimientos y estado de carga
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(false);

  // Stock inicial
  const [stockInicial, setStockInicial] = useState(null);

  // Modal para ver documento
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [docData, setDocData] = useState(null);

  useEffect(() => {
    fetchAlmacenes();
    fetchProductos();
  }, []);

  useEffect(() => {
    if (!almacenId || !productId) {
      setMovements([]);
      setStockInicial(null);
      return;
    }
    fetchMovements();
    fetchStockInicial(almacenId, productId);
  }, [almacenId, productId]);

  async function fetchAlmacenes() {
    try {
      const res = await fetch('/api/almacenes');
      if (!res.ok) throw new Error('Error al obtener almacenes');
      const data = await res.json();
      setAlmacenes(data);
    } catch (error) {
      console.error(error);
    }
  }

  async function fetchProductos() {
    try {
      const res = await fetch('/api/articulos');
      if (!res.ok) throw new Error('Error al obtener artículos');
      const data = await res.json();
      setProductos(data);
    } catch (error) {
      console.error(error);
    }
  }

  async function fetchMovements() {
    setLoading(true);
    try {
      const url = `/api/warehouse-movements?almacen_id=${almacenId}&product_id=${productId}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Error al obtener movimientos');
      const data = await res.json();
      setMovements(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchStockInicial(aId, pId) {
    try {
      const url = `/api/inventario-inicial/stock?almacen_id=${aId}&cod_articulo=${pId}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Error al obtener stock inicial');
      const data = await res.json();
      const si = parseFloat(data.stock_inicial) || 0;
      setStockInicial(si);
    } catch (error) {
      console.error(error);
      setStockInicial(null);
    }
  }

  function calculateStockFinal() {
    if (stockInicial === null) return '';
    let sumIngreso = 0;
    let sumSalida = 0;
    movements.forEach(m => {
      const mov = (m.warehouse_document?.tipo_movimiento || '').toUpperCase();
      const qty = parseFloat(m.cantidad) || 0;
      if (mov === 'INGRESO') sumIngreso += qty;
      if (mov === 'SALIDA')  sumSalida += qty;
    });
    return stockInicial + sumIngreso - sumSalida;
  }

  const handleViewDoc = async (docId) => {
    try {
      const res = await fetch(`/api/warehouse-documents/${docId}`);
      if (!res.ok) throw new Error('Error al obtener documento');
      const data = await res.json();
      setDocData(data);
      setIsDocModalOpen(true);
    } catch (error) {
      console.error(error);
    }
  };

  const handleCloseModal = () => {
    setDocData(null);
    setIsDocModalOpen(false);
  };

  // Columnas
  const columns = [
    {
      name: 'Fecha',
      selector: row => row.warehouse_document?.fecha || '-',
      width: '130px',
      sortable: true,
    },
    {
      name: 'Producto',
      selector: row => row.articulo?.nombrearticulo || 'Sin nombre',
      grow: 2,
      sortable: true,
    },
    {
      name: 'Tipo Mov.',
      width: '100px',
      cell: row => {
        const mov = (row.warehouse_document?.tipo_movimiento || '').toUpperCase();
        if (mov === 'INGRESO') return <span className="text-green-600 font-bold">{mov}</span>;
        if (mov === 'SALIDA')  return <span className="text-red-600 font-bold">{mov}</span>;
        return mov;
      },
      sortable: true,
    },
    {
      name: 'Cantidad',
      selector: row => row.cantidad,
      width: '100px',
      sortable: true,
    },
    {
      name: 'Acción',
      cell: row => (
        <IconButton
          icon={Eye}
          label="Ver"
          variant="info"
          size="sm"
          onClick={() => handleViewDoc(row.warehouse_document_id)}
        />
      ),
      width: '80px'
    }
  ];

  // Preparamos items para SelectWithSearchInDropdown
  const itemsArticulos = productos.map((p) => ({
    label: p.nombrearticulo,
    value: p.codarticulo,
  }));

  const stockFinal = calculateStockFinal();

  return (
    <MainLayout>
      <div className="container mx-auto p-6 bg-white shadow-lg rounded-lg">
        <h1 className="text-2xl font-bold mb-4">Movimientos de Almacén</h1>

        {/* Filtros */}
        <div className="flex flex-wrap gap-6 mb-6 items-end relative">
          {/* Selector Almacén */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">
              Almacén
            </label>
            <select
              className="border px-2 py-1 rounded w-52"
              value={almacenId}
              onChange={(e) => {
                setAlmacenId(e.target.value);
                // al cambiar almacén, reseteamos productId
                setProductId('');
                setMovements([]);
                setStockInicial(null);
              }}
            >
              <option value="">Seleccione...</option>
              {almacenes.map((alm) => (
                <option key={alm.id} value={alm.id}>
                  {alm.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Select con búsqueda en el dropdown */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">
              Artículo
            </label>
            <SelectWithSearchInDropdown
              items={itemsArticulos}
              placeholder="Buscar artículo..."
              width="w-72"
              value={productId}
              onChange={(val) => {
                setProductId(val);
              }}
            />
          </div>

          {/* Stock Inicial */}
          {almacenId && productId && (
            <div className="flex flex-col items-center" style={{ width: '150px' }}>
              <span className="text-sm font-medium text-gray-700 mb-1">Stock Inicial</span>
              <span className="border px-3 py-2 rounded text-center font-medium w-full">
                {stockInicial !== null ? stockInicial : 'N/A'}
              </span>
            </div>
          )}
        </div>

        <DataTable
          columns={columns}
          data={movements}
          progressPending={loading}
          progressComponent={<div className="p-4">Cargando movimientos...</div>}
          noDataComponent={<div className="p-4">No hay movimientos registrados.</div>}
          highlightOnHover
          pointerOnHover
        />

        {/* Stock Final */}
        {almacenId && productId && (
          <div className="flex justify-end mt-2">
            <div className="border bg-gray-50 rounded p-2 font-semibold text-blue-600">
              Stock Final: {stockFinal !== '' ? stockFinal : '---'}
            </div>
          </div>
        )}

        {/* Modal para ver documento */}
        {isDocModalOpen && (
          <ViewDocModal
            isOpen={isDocModalOpen}
            onClose={handleCloseModal}
            docData={docData}
          />
        )}
      </div>
    </MainLayout>
  );
}
