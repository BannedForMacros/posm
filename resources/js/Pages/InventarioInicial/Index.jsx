import React, { useState, useEffect } from 'react';
import MainLayout from '@/Layouts/MainLayout';
import DataTable from 'react-data-table-component';
import Swal from 'sweetalert2';
import { Save } from 'lucide-react';

// Importa tu componente sin cambios
import EstadoIndicador from '@/Components/ui/EstadoIndicador';

const customStyles = {
  headRow: { style: { backgroundColor: '#333', color: '#fff' } },
};

const InventarioIndex = ({ auth }) => {
  const userName = auth?.user?.name || 'Usuario';

  const [inventario, setInventario] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros - eliminado sucursalId
  const [almacenId, setAlmacenId] = useState('0');
  const [busqueda, setBusqueda] = useState('');

  // Eliminado sucursales
  const [almacenes, setAlmacenes] = useState([]);

  // Modo asignación
  const [isAsignandoStock, setIsAsignandoStock] = useState(false);
  // Para editar stock: { [codarticulo]: string }
  const [editStock, setEditStock] = useState({});

  useEffect(() => {
    fetchAlmacenes();
  }, []);

  useEffect(() => {
    if (!isAsignandoStock) {
      fetchInventario();
    }
  }, [busqueda]);

  const fetchAlmacenes = async () => {
    try {
      const res = await fetch('/api/almacenes');
      if (!res.ok) throw new Error('Error al obtener almacenes');
      const data = await res.json();
      setAlmacenes(data);
    } catch (error) {
      console.error('fetchAlmacenes:', error);
    }
  };

  // Cargar inventario desde /api/inventario-inicial
  const fetchInventario = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (almacenId !== '0')  params.append('almacen_id', almacenId);
      if (busqueda.trim() !== '') params.append('busqueda', busqueda);

      // AHORA: /api/inventario-inicial
      const url = `/api/inventario-inicial?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Error al obtener inventario inicial: ${res.status}`);
      }
      const data = await res.json();
      setInventario(data);
      setLoading(false);

      const temp = {};
      data.forEach(row => {
        if (!row.stock_inicial || row.stock_inicial === 0) {
          temp[row.codarticulo] = '';
        } else {
          temp[row.codarticulo] = row.stock_inicial;
        }
      });
      setEditStock(temp);
    } catch (error) {
      console.error('fetchInventario:', error);
      setLoading(false);
      Swal.fire('Error', error.message, 'error');
    }
  };

  const handleFiltrarAlm = () => {
    if (!isAsignandoStock) {
      fetchInventario();
    }
  };

  // Modo asignación
  const handleAsignarStockInicial = () => {
    setIsAsignandoStock(true);
  };

  const handleCancelarAsignacion = () => {
    setIsAsignandoStock(false);
    setEditStock({});
    fetchInventario();
  };

  // Guardar stock inicial => /api/inventario-inicial/registrar-stock
  const handleGuardarStockInicial = async () => {
    let errores = [];
    for (const row of inventario) {
      if (row.stock_inicial && row.stock_inicial > 0) continue;
      const val = editStock[row.codarticulo];
      if (!val || parseFloat(val) <= 0) continue;

      const body = {
        almacen_id: parseInt(almacenId),
        cod_articulo: row.codarticulo,
        stock_inicial: parseFloat(val)
      };

      const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
      // Ajustamos la ruta:
      const res = await fetch('/api/inventario-inicial/registrar-stock', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': token
        },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) {
        errores.push(data.message || `Error con artículo ${row.codarticulo}`);
      }
    }

    if (errores.length > 0) {
      Swal.fire('Error', errores.join('\n'), 'error');
    } else {
      Swal.fire('¡Éxito!', 'Stock inicial asignado correctamente', 'success');
    }
    setIsAsignandoStock(false);
    fetchInventario();
  };

  // Toggle estado en inventario => /api/inventario-inicial/update-estado
  const handleToggleEstado = async (row) => {
    const newActivo = row.activo ? 0 : 1;
    try {
      const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
      const res = await fetch('/api/inventario-inicial/update-estado', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': token
        },
        body: JSON.stringify({
          codarticulo: row.codarticulo,
          activo: newActivo
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Error al actualizar estado');
      }
      // Recargar
      fetchInventario();
    } catch (error) {
      Swal.fire('Error', error.message, 'error');
    }
  };

  const handleChangeStock = (codart, value) => {
    setEditStock(prev => ({
      ...prev,
      [codart]: value
    }));
  };

  // Título dinámico
  const selectedAlmacen = almacenes.find(a => a.id == almacenId);

  let titulo = 'Inventario';
  if (almacenId !== '0' && selectedAlmacen) {
    titulo += ` de ${selectedAlmacen.nombre}`;
  } else {
    titulo += ` de ${userName}`;
  }

  // Columnas: Artículo, Stock Inicial, Estado
  const columns = [
    {
      name: 'Artículo',
      selector: row => row.nombrearticulo || 'Artículo sin nombre',
      sortable: true,
      grow: 2
    },
    {
      name: 'Stock Inicial',
      cell: row => {
        const val = editStock[row.codarticulo] ?? '';
        const disabled = !isAsignandoStock || (row.stock_inicial && row.stock_inicial > 0);
        return (
          <input
            type="number"
            className="border p-1 w-20 text-right"
            disabled={disabled}
            value={val}
            onChange={e => handleChangeStock(row.codarticulo, e.target.value)}
          />
        );
      },
      width: '140px',
      right: true
    },
    {
      name: 'Estado',
      cell: row => (
        // Envolvemos EstadoIndicador en un <div> clickable:
        <div
          onClick={() => handleToggleEstado(row)}
          style={{ cursor: 'pointer' }}
        >
          <EstadoIndicador estado={row.activo} />
        </div>
      ),
      width: '160px'
    }
  ];

  return (
    <MainLayout>
      <div className="container mx-auto p-6 bg-white shadow-lg rounded-lg">

        {/* Encabezado con título y botón */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">{titulo}</h1>

          {!isAsignandoStock ? (
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
              onClick={handleAsignarStockInicial}
            >
              Asignar Stock Inicial
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 transition"
                onClick={handleCancelarAsignacion}
              >
                Cancelar Asignación
              </button>
              <button
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
                onClick={handleGuardarStockInicial}
              >
                Guardar Stock
              </button>
            </div>
          )}
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap justify-between items-end gap-6 mb-4">
          {/* Almacén, Filtrar (izquierda) */}
          <div className="flex items-end gap-4">
            {almacenes.length > 0 && (
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700">Almacén</label>
                <select
                  value={almacenId}
                  onChange={e => setAlmacenId(e.target.value)}
                  className="border rounded px-2 py-1"
                  disabled={isAsignandoStock}
                >
                  <option value="0">Todos</option>
                  {almacenes.map(a => (
                    <option key={a.id} value={a.id}>{a.nombre}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
                onClick={handleFiltrarAlm}
                disabled={isAsignandoStock}
              >
                Filtrar
              </button>
            </div>
          </div>

          {/* Búsqueda a la derecha */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700">Buscar Artículo</label>
            <input
              type="text"
              className="border rounded px-3 py-1"
              style={{ width: '350px' }}
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              disabled={isAsignandoStock}
              placeholder="Búsqueda en tiempo real"
            />
          </div>
        </div>

        {/* Tabla */}
        <DataTable
          columns={columns}
          data={inventario}
          customStyles={customStyles}
          pagination={false}
          progressPending={loading}
          progressComponent={<div className="p-4">Cargando inventario...</div>}
          noDataComponent={<div className="p-4">No se encontraron artículos.</div>}
          highlightOnHover
          pointerOnHover
        />
      </div>
    </MainLayout>
  );
};

export default InventarioIndex;