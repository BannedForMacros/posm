import React, { useState, useEffect } from 'react';
import MainLayout from '@/Layouts/MainLayout';
import DataTable from 'react-data-table-component';
import IconButton from '@/Components/ui/IconButton';
import { Eye } from 'lucide-react';
import ViewDocModal from './components/ViewDocModal';

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

  // Stock inicial (mostrado arriba)
  const [stockInicial, setStockInicial] = useState(null);

  // Modal para ver documento
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [docData, setDocData] = useState(null);

  // Al montar, cargamos almacenes y productos
  useEffect(() => {
    fetchAlmacenes();
    fetchProductos();
  }, []);

  // Cada vez que cambien almacenId o productId => cargar movimientos + stock inicial
  useEffect(() => {
    if (!almacenId || !productId) {
      // Limpieza si falta algo
      setMovements([]);
      setLoading(false);
      setStockInicial(null);
      return;
    }
    // 1) Movimientos
    fetchMovements();
    // 2) Stock inicial
    fetchStockInicial(almacenId, productId);
  }, [almacenId, productId]);

  // ======== Llamadas a la API ========
  async function fetchAlmacenes() {
    try {
      const res = await fetch('/api/almacenes');
      if (!res.ok) throw new Error('Error al obtener almacenes');
      const data = await res.json();
      setAlmacenes(data);
    } catch (error) {
      console.error('fetchAlmacenes:', error);
    }
  }

  async function fetchProductos() {
    try {
      const res = await fetch('/api/articulos');
      if (!res.ok) throw new Error('Error al obtener productos');
      const data = await res.json();
      setProductos(data);
    } catch (error) {
      console.error('fetchProductos:', error);
    }
  }

  async function fetchMovements() {
    setLoading(true);
    try {
      let url = `/api/warehouse-movements?almacen_id=${almacenId}&product_id=${productId}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Error al obtener movimientos');
      const data = await res.json();
      setMovements(data);
    } catch (error) {
      console.error('fetchMovements:', error);
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
      console.error('fetchStockInicial:', error);
      setStockInicial(null);
    }
  }
  

  // ======== Cálculo de Stock Final ========
  // stockFinal = stockInicial + sum(INGRESO) - sum(SALIDA)
  function calculateStockFinal() {
    if (stockInicial === null) return '';
    let sumIngreso = 0;
    let sumSalida = 0;

    movements.forEach(m => {
      const mov = (m.warehouse_document?.tipo_movimiento || '').toUpperCase();
      const qty = parseFloat(m.cantidad) || 0;
      if (mov === 'INGRESO') {
        sumIngreso += qty;
      } else if (mov === 'SALIDA') {
        sumSalida += qty;
      }
    });

    return stockInicial + sumIngreso - sumSalida;
  }

  // Modal: ver documento
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

  // Columnas de la tabla
  const columns = [
    {
      name: 'Fecha',
      selector: row => row.warehouse_document?.fecha || '-',
      sortable: true,
      width: '130px'
    },
    {
      name: 'Producto',
      selector: row => row.articulo?.nombrearticulo || 'Sin nombre',
      sortable: true,
      grow: 2
    },
    {
      name: 'Tipo Mov.',
      cell: row => {
        const mov = (row.warehouse_document?.tipo_movimiento || '').toUpperCase();
        return mov === 'INGRESO' 
          ? <span className="text-green-600 font-bold">{mov}</span>
          : mov === 'SALIDA'
          ? <span className="text-red-600 font-bold">{mov}</span>
          : mov;
      },
      sortable: true,
      width: '100px'
    },
    {
      name: 'Cantidad',
      selector: row => row.cantidad,
      sortable: true,
      width: '120px'
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

  // Stock final
  const stockFinal = calculateStockFinal();

  return (
    <MainLayout>
      <div className="container mx-auto p-6 bg-white shadow-lg rounded-lg">
        <h1 className="text-2xl font-bold mb-4">Movimientos de Almacén</h1>
          {/* Contenedor principal con posición relativa para el posicionamiento absoluto */}
          <div className="relative flex flex-wrap mb-6">
            {/* Selectors container - a la izquierda */}
            <div className="flex gap-6 items-end">
              {/* Selector de Almacén */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">
                  Almacén
                </label>
                <select
                  value={almacenId}
                  onChange={e => setAlmacenId(e.target.value)}
                  className="border px-2 py-1 rounded w-52"
                >
                  <option value="">Seleccione...</option>
                  {almacenes.map(alm => (
                    <option key={alm.id} value={alm.id}>
                      {alm.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selector de Producto */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">
                  Producto
                </label>
                <select
                  value={productId}
                  onChange={e => setProductId(e.target.value)}
                  className="border px-2 py-1 rounded w-72"
                >
                  <option value="">Seleccione...</option>
                  {productos.map(prod => (
                    <option key={prod.codarticulo} value={prod.codarticulo}>
                      {prod.nombrearticulo}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Stock Inicial con posicionamiento absoluto */}
            <div className="absolute" style={{ right: '100px', bottom: '0' }}>
              <div className="flex flex-col items-center" style={{ width: '150px' }}>
                <span className="text-sm font-medium text-gray-700 mb-1">Stock Inicial</span>
                <span className="font-medium">{stockInicial !== null ? stockInicial : 'N/A'}</span>
              </div>
            </div>
          </div>

        {/* Tabla de movimientos */}
        <DataTable
          columns={columns}
          data={movements}
          progressPending={loading}
          progressComponent={<div className="p-4">Cargando movimientos...</div>}
          noDataComponent={<div className="p-4">No hay movimientos registrados.</div>}
          highlightOnHover
          pointerOnHover
        />

        {/* Footer alineado con la columna Cantidad */}
        <div className="flex justify-end mt-2">
          {/* 1) Fecha => width=130px */}
          <div style={{ width: '200px' }} />
          {/* 2) Producto => flexGrow=2 */}
          <div style={{ flexGrow: 2 }} />
          {/* 3) Cantidad => width=120px => aquí el "Total Stock" */}
          <div style={{ width: '150px', textAlign: 'center' }}>
            {stockFinal !== '' && (
              <div className="border bg-gray-50 rounded p-1 font-semibold text-blue-600">
                Total Stock: {stockFinal}
              </div>
            )}
          </div>
          {/* 4) Tipo Mov. => width=100px */}
          <div style={{ width: '10px' }} />
          {/* 5) Acción => width=80px */}
          <div style={{ width: '80px' }} />
        </div>

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