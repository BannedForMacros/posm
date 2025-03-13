import React, { useState, useEffect } from 'react';
import MainLayout from '@/Layouts/MainLayout';
import DataTable from 'react-data-table-component';
import IconButton from '@/Components/ui/IconButton';
import { Eye, Search } from 'lucide-react';

// Ajusta la ruta si tu ModalMediano está en otro lugar
import ModalMediano from '@/Components/ui/ModalMediano';

export default function Index() {
  // Lista de inventario
  const [inventarios, setInventarios] = useState([]);
  const [loading, setLoading] = useState(false);

  // Lista de almacenes para el selector
  const [almacenes, setAlmacenes] = useState([]);

  // Filtros
  const [almacenId, setAlmacenId] = useState('');
  const [searchText, setSearchText] = useState('');

  // Modal: Ver Movimientos
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Cargar almacenes al montar
  useEffect(() => {
    fetchAlmacenes();
  }, []);

  // Cada vez que cambie almacenId o searchText => cargar inventario
  useEffect(() => {
    fetchInventario();
  }, [almacenId, searchText]);

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

  // Cargar inventario con ?almacen_id=...&search=...
  async function fetchInventario() {
    setLoading(true);
    try {
      let url = '/api/inventario?';
      if (almacenId) url += `almacen_id=${almacenId}&`;
      if (searchText) url += `search=${encodeURIComponent(searchText)}&`;

      const res = await fetch(url);
      if (!res.ok) throw new Error('Error al obtener inventario');
      const data = await res.json();
      setInventarios(data);
    } catch (error) {
      console.error('fetchInventario:', error);
    } finally {
      setLoading(false);
    }
  }

  // Columnas de la tabla principal (Inventario)
  const columns = [
    {
      name: 'Almacén',
      selector: row => row.almacen?.nombre || `Almacén #${row.almacen_id}`,
      sortable: true,
      width: '160px'
    },
    {
      name: 'Artículo',
      selector: row => row.articulo?.nombrearticulo || `Cód: ${row.cod_articulo}`,
      sortable: true,
      grow: 2
    },
    {
      name: 'Stock',
      selector: row => row.stock,
      sortable: true,
      width: '80px'
    },
    {
      name: 'Acciones',
      cell: row => (
        <IconButton
          icon={Eye}
          label="Ver Movimientos"
          variant="info"
          size="sm"
          onClick={() => handleOpenMovements(row)}
        />
      ),
      width: '150px'
    }
  ];

  // Abrir modal de movimientos
  const handleOpenMovements = (row) => {
    setSelectedItem({
      almacenId: row.almacen_id,
      codArticulo: row.cod_articulo,
      nombreArticulo: row.articulo?.nombrearticulo || `Artículo #${row.cod_articulo}`,
      almacenName: row.almacen?.nombre || `Almacén #${row.almacen_id}`
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedItem(null);
    setIsModalOpen(false);
  };

  return (
    <MainLayout>
      <div className="container mx-auto p-6 bg-white shadow-lg rounded-lg">
        <h1 className="text-2xl font-bold mb-4">Inventario</h1>

        {/* Filtros */}
        <div className="flex flex-wrap items-end gap-4 mb-4">
          {/* Selector de Almacén */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700">
              Almacén
            </label>
            <select
              className="border rounded px-2 py-1 w-52"
              value={almacenId}
              onChange={e => setAlmacenId(e.target.value)}
            >
              <option value="">Todos</option>
              {almacenes.map(a => (
                <option key={a.id} value={a.id}>
                  {a.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Buscador de texto */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700">
              Buscar artículo
            </label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <input
                type="text"
                className="border rounded pl-8 pr-2 py-1 w-64"
                placeholder="Nombre del artículo"
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Tabla */}
        <DataTable
          columns={columns}
          data={inventarios}
          progressPending={loading}
          progressComponent={<div className="p-4">Cargando inventario...</div>}
          noDataComponent={<div className="p-4">No hay datos de inventario.</div>}
          highlightOnHover
          pointerOnHover
        />

        {/* Modal de Movimientos */}
        {isModalOpen && selectedItem && (
          <MovementsModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            almacenId={selectedItem.almacenId}
            codArticulo={selectedItem.codArticulo}
            nombreArticulo={selectedItem.nombreArticulo}
            almacenName={selectedItem.almacenName}
          />
        )}
      </div>
    </MainLayout>
  );
}

/**
 * Subcomponente MovementsModal
 * Incorporamos la obtención de "stock inicial"
 * 
 * Usamos size="large" en ModalMediano para forzar mayor ancho (si tu Modal lo soporta).
 */
function MovementsModal({
  isOpen,
  onClose,
  almacenId,
  codArticulo,
  nombreArticulo,
  almacenName
}) {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(false);

  // Stock inicial
  const [stockInicial, setStockInicial] = useState(null);

  useEffect(() => {
    if (isOpen && almacenId && codArticulo) {
      fetchMovements();
      fetchStockInicial();
    }
  }, [isOpen, almacenId, codArticulo]);

  // 1) Cargar movimientos
  async function fetchMovements() {
    setLoading(true);
    try {
      const url = `/api/warehouse-movements?almacen_id=${almacenId}&product_id=${codArticulo}`;
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

  // 2) Cargar stock inicial
  async function fetchStockInicial() {
    try {
      // Ajusta la ruta si tu endpoint es distinto
      // Ej: /api/inventario-inicial/stock?almacen_id=xx&cod_articulo=yy
      const url = `/api/inventario-inicial/stock?almacen_id=${almacenId}&cod_articulo=${codArticulo}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Error al obtener stock inicial');
      const data = await res.json();
      setStockInicial(parseFloat(data.stock_inicial) || 0);
    } catch (error) {
      console.error('fetchStockInicial:', error);
      setStockInicial(null);
    }
  }

  // Columna para mostrar si el movimiento está ligado a una compra (facturación) o a una venta
  function renderDocumento(row) {
    const doc = row.warehouse_document;
    if (!doc) return '-';

    // Si existe facturacion_id => "Compra (#...)"
    if (doc.facturacion_id) {
      return `Compra (#${doc.facturacion_id})`;
    }
    // Si existe venta_id => "Venta (#...)"
    if (doc.venta_id) {
      return `Venta (#${doc.venta_id})`;
    }
    // Si no hay ninguno => '-'
    return '-';
  }

  // Columnas de la tabla de movimientos
  const columns = [
    {
      name: 'Fecha',
      width: '160px',
      cell: row => {
        const fecha = row.warehouse_document?.fecha;
        if (!fecha) return '---';
        const dateObj = new Date(fecha);
        return dateObj.toLocaleString('es-PE', {
          dateStyle: 'short',
          timeStyle: 'short'
        });
      }
    },
    {
      name: 'Tipo Mov.',
      width: '120px',
      cell: row => {
        const mov = (row.warehouse_document?.tipo_movimiento || '').toUpperCase();
        if (mov === 'INGRESO') {
          return <span className="text-green-600 font-bold">{mov}</span>;
        } else if (mov === 'SALIDA') {
          return <span className="text-red-600 font-bold">{mov}</span>;
        }
        return <span className="text-gray-600 font-bold">{mov}</span>;
      }
    },
    {
      name: 'Cantidad',
      width: '100px',
      selector: row => parseFloat(row.cantidad).toFixed(2)
    },
    {
      name: 'Documento',
      width: '180px',
      cell: row => renderDocumento(row)
    },
    {
      name: 'Operación',
      selector: row => row.warehouse_document?.operacion?.descripcion || '-',
      width: '180px'
    },
    {
      name: 'Usuario',
      selector: row => row.warehouse_document?.user?.name || '-',
      width: '180px'
    }
  ];

  if (!isOpen) return null;

  // Cálculo del stock final
  // stockFinal = stockInicial + sum(INGRESO) - sum(SALIDA)
  function calculateStockFinal() {
    if (stockInicial === null) return null; // si no se cargó
    let sumIngreso = 0;
    let sumSalida = 0;

    movements.forEach(m => {
      const mov = m.warehouse_document?.tipo_movimiento?.toUpperCase() || '';
      const qty = parseFloat(m.cantidad) || 0;
      if (mov === 'INGRESO') sumIngreso += qty;
      if (mov === 'SALIDA') sumSalida += qty;
    });

    return stockInicial + sumIngreso - sumSalida;
  }
  const stockFinal = calculateStockFinal();

  return (
    <ModalMediano
      isOpen={isOpen}
      onClose={onClose}
      title="Movimientos del Artículo"
      size="large"  // si tu ModalMediano soporta esta prop para mayor anchura
    >
      <div className="p-4 max-w-full space-y-4">
        {/* Encabezado con información del artículo y almacén */}
        <div className="flex flex-col gap-2 md:flex-row md:justify-between md:items-center">
          <div>
            <h2 className="text-lg font-bold mb-1">
              Artículo: {nombreArticulo}
            </h2>
            <p className="text-sm text-gray-600">
              Almacén: <strong>{almacenName}</strong>
            </p>
          </div>
          <button
            className="text-gray-500 hover:text-gray-700 flex items-center gap-1"
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>

        <hr />

        {/* Stock Inicial y Final */}
        <div className="flex gap-4 items-center bg-gray-50 p-2 rounded">
          <div>
            <span className="text-sm font-medium text-gray-700">Stock Inicial:</span>{' '}
            {stockInicial !== null ? (
              <span className="font-semibold">{stockInicial.toFixed(2)}</span>
            ) : (
              <span className="text-gray-500">N/A</span>
            )}
          </div>
          <div>
            <span className="text-sm font-medium text-gray-700">Stock Final:</span>{' '}
            {stockFinal !== null ? (
              <span className="font-semibold">{stockFinal.toFixed(2)}</span>
            ) : (
              <span className="text-gray-500">N/A</span>
            )}
          </div>
        </div>

        {/* Tabla de movimientos */}
        <DataTable
          columns={columns}
          data={movements}
          progressPending={loading}
          progressComponent={<div className="p-4">Cargando movimientos...</div>}
          noDataComponent={<div className="p-4">No hay movimientos.</div>}
          highlightOnHover
          pointerOnHover
        />
      </div>
    </ModalMediano>
  );
}
