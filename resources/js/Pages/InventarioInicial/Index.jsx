import React, { useState, useEffect } from 'react';
import MainLayout from '@/Layouts/MainLayout';
import DataTable from 'react-data-table-component';
import Swal from 'sweetalert2';

import EstadoIndicador from '@/Components/ui/EstadoIndicador'; // Indicador "Activo"/"Inactivo"

const customStyles = {
  headRow: { style: { backgroundColor: '#333', color: '#fff' } },
};

/**
 * Formatea un número, devolviendo entero si es entero, o 2 decimales si no lo es.
 * Si el valor es nulo/vacío o NaN, retorna cadena vacía.
 */
function formatNumber(value) {
  if (value == null || value === '') return '';
  const num = parseFloat(value);
  if (Number.isNaN(num)) return '';
  // Si es entero
  if (Number.isInteger(num)) {
    return num.toString(); 
  }
  // Caso contrario, 2 decimales
  return num.toFixed(2);
}

export default function InventarioIndex({ auth }) {
  const userName = auth?.user?.name || 'Usuario';

  const [inventario, setInventario] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [almacenId, setAlmacenId] = useState('0');
  const [busqueda, setBusqueda]   = useState('');

  // Lista de almacenes
  const [almacenes, setAlmacenes] = useState([]);

  // Modo asignación de stock inicial
  const [isAsignandoStock, setIsAsignandoStock] = useState(false);
  const [editStock, setEditStock] = useState({}); // { [codarticulo]: "valor" }

  // Modo asignación de stock min/máx
  const [isAsignandoMinMax, setIsAsignandoMinMax] = useState(false);
  // Estructura: { [codarticulo]: { min: "...", max: "..." } }
  const [editMinMax, setEditMinMax] = useState({});

  useEffect(() => {
    fetchAlmacenes();
  }, []);

  // Cargar inventario sólo si hay un almacén seleccionado (≠ "0") 
  // y no estamos en modo asignación.
  useEffect(() => {
    if (!isAsignandoStock && !isAsignandoMinMax && almacenId !== '0') {
      fetchInventario();
    } else {
      // Si no hay almacén, limpiar
      setInventario([]);
      setLoading(false);
    }
  }, [busqueda, almacenId]);

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

  // Cargar inventario inicial
  async function fetchInventario() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (almacenId !== '0') params.append('almacen_id', almacenId);
      if (busqueda.trim() !== '') params.append('busqueda', busqueda);

      const url = `/api/inventario-inicial?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Error al obtener inventario inicial: ${res.status}`);
      }
      const data = await res.json();
      setInventario(data);
      setLoading(false);

      // Inicializar editStock y editMinMax
      const tempStock = {};
      const tempMinMax = {};
      data.forEach(row => {
        // Stock inicial
        tempStock[row.codarticulo] = row.stock_inicial && row.stock_inicial > 0
          ? String(row.stock_inicial)
          : '';

        // Stock mínimo/máximo
        tempMinMax[row.codarticulo] = {
          min: row.stock_minimo ? String(row.stock_minimo) : '',
          max: row.stock_maximo ? String(row.stock_maximo) : ''
        };
      });
      setEditStock(tempStock);
      setEditMinMax(tempMinMax);

    } catch (error) {
      console.error('fetchInventario:', error);
      setLoading(false);
      Swal.fire('Error', error.message, 'error');
    }
  }

  // ======== STOCK INICIAL ========
  const handleAsignarStockInicial = () => {
    setIsAsignandoStock(true);
    setIsAsignandoMinMax(false);
  };
  const handleCancelarAsignacion = () => {
    setIsAsignandoStock(false);
    setEditStock({});
    fetchInventario();
  };
  const handleGuardarStockInicial = async () => {
    if (almacenId === '0') {
      Swal.fire('Atención', 'Debes seleccionar un Almacén primero', 'info');
      return;
    }
    let errores = [];
    for (const row of inventario) {
      // si ya tiene stock_inicial > 0, no lo cambiamos
      if (row.stock_inicial && row.stock_inicial > 0) continue;

      const val = editStock[row.codarticulo];
      if (!val || parseFloat(val) <= 0) continue;

      const body = {
        almacen_id: parseInt(almacenId),
        cod_articulo: row.codarticulo,
        stock_inicial: parseFloat(val)
      };

      const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
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

  // ======== STOCK MIN/MÁX ========
  const handleAsignarMinMax = () => {
    setIsAsignandoMinMax(true);
    setIsAsignandoStock(false);
  };
  const handleCancelarMinMax = () => {
    setIsAsignandoMinMax(false);
    setEditMinMax({});
    fetchInventario();
  };
  const handleGuardarMinMax = async () => {
    if (almacenId === '0') {
      Swal.fire('Atención', 'Debes seleccionar un Almacén primero', 'info');
      return;
    }
    let errores = [];
    for (const row of inventario) {
      const mm = editMinMax[row.codarticulo];
      if (!mm) continue;

      const minVal = mm.min ? parseFloat(mm.min) : 0;
      const maxVal = mm.max ? parseFloat(mm.max) : 0;

      // si no ingresaron nada, saltar
      if (minVal === 0 && maxVal === 0) continue;

      const body = {
        almacen_id: parseInt(almacenId),
        cod_articulo: row.codarticulo,
        stock_minimo: minVal,
        stock_maximo: maxVal
      };

      const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
      const res = await fetch('/api/inventario-inicial/registrar-minmax', {
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
      Swal.fire('¡Éxito!', 'Stock mínimo/máximo asignado correctamente', 'success');
    }
    setIsAsignandoMinMax(false);
    fetchInventario();
  };

  // Toggle estado
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
      fetchInventario();
    } catch (error) {
      Swal.fire('Error', error.message, 'error');
    }
  };

  // Handlers de input
  const handleChangeStock = (codart, value) => {
    setEditStock(prev => ({
      ...prev,
      [codart]: value
    }));
  };
  const handleChangeMinMax = (codart, field, value) => {
    setEditMinMax(prev => ({
      ...prev,
      [codart]: {
        ...prev[codart],
        [field]: value
      }
    }));
  };

  // Render numérico con la función formatNumber
  function renderNumberOrInputStock(row) {
    // Modo edición de stock inicial
    if (isAsignandoStock) {
      // Si ya tiene stock_inicial > 0, no se edita
      if (row.stock_inicial && row.stock_inicial > 0) {
        return (
          <div className="text-right">
            {formatNumber(row.stock_inicial)}
          </div>
        );
      }
      // Caso sin stock => input
      const val = editStock[row.codarticulo] ?? '';
      return (
        <input
          type="number"
          className="border p-1 w-20 text-right"
          value={val}
          onChange={e => handleChangeStock(row.codarticulo, e.target.value)}
        />
      );
    } else {
      // Modo lectura
      return <div className="text-right">{formatNumber(row.stock_inicial)}</div>;
    }
  }

  function renderNumberOrInputMin(row) {
    // Modo edición min
    if (isAsignandoMinMax) {
      const mm = editMinMax[row.codarticulo] || { min: '', max: '' };
      return (
        <input
          type="number"
          className="border p-1 w-20 text-right"
          value={mm.min}
          onChange={e => handleChangeMinMax(row.codarticulo, 'min', e.target.value)}
        />
      );
    } else {
      return <div className="text-right">{formatNumber(row.stock_minimo)}</div>;
    }
  }

  function renderNumberOrInputMax(row) {
    // Modo edición max
    if (isAsignandoMinMax) {
      const mm = editMinMax[row.codarticulo] || { min: '', max: '' };
      return (
        <input
          type="number"
          className="border p-1 w-20 text-right"
          value={mm.max}
          onChange={e => handleChangeMinMax(row.codarticulo, 'max', e.target.value)}
        />
      );
    } else {
      return <div className="text-right">{formatNumber(row.stock_maximo)}</div>;
    }
  }

  // Título
  const selectedAlmacen = almacenes.find(a => a.id == almacenId);
  let titulo = 'Inventario';
  if (almacenId !== '0' && selectedAlmacen) {
    titulo += ` de ${selectedAlmacen.nombre}`;
  } else {
    titulo += ` de ${userName}`;
  }

  // Columnas
  const columns = [
    {
      name: 'Artículo',
      selector: row => row.nombrearticulo || 'Artículo sin nombre',
      sortable: true,
      grow: 2
    },
    {
      name: 'Stock Inicial',
      width: '130px',
      cell: row => renderNumberOrInputStock(row),
      right: true
    },
    {
      name: 'Stock Mín.',
      width: '130px',
      cell: row => renderNumberOrInputMin(row),
      right: true
    },
    {
      name: 'Stock Máx.',
      width: '130px',
      cell: row => renderNumberOrInputMax(row),
      right: true
    },
    {
      name: 'Estado',
      width: '150px',
      cell: row => (
        <div
          onClick={() => handleToggleEstado(row)}
          style={{ cursor: 'pointer' }}
        >
          <EstadoIndicador estado={row.activo} />
        </div>
      )
    }
  ];

  return (
    <MainLayout>
      <div className="container mx-auto p-6 bg-white shadow-lg rounded-lg">

        {/* Encabezado con título y botones */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
          <h1 className="text-3xl font-bold">{titulo}</h1>

          {/* Botones de asignación */}
          <div className="flex flex-wrap gap-2">
            {/* Botón Stock Inicial */}
            {!isAsignandoStock && !isAsignandoMinMax ? (
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                onClick={handleAsignarStockInicial}
                disabled={almacenId === '0'}
              >
                Asignar Stock Inicial
              </button>
            ) : (
              isAsignandoStock && (
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
              )
            )}

            {/* Botón Stock Min/Max */}
            {!isAsignandoMinMax && !isAsignandoStock ? (
              <button
                className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 transition"
                onClick={handleAsignarMinMax}
                disabled={almacenId === '0'}
              >
                Asignar Min/Max
              </button>
            ) : (
              isAsignandoMinMax && (
                <div className="flex items-center gap-2">
                  <button
                    className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 transition"
                    onClick={handleCancelarMinMax}
                  >
                    Cancelar Min/Max
                  </button>
                  <button
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
                    onClick={handleGuardarMinMax}
                  >
                    Guardar Min/Max
                  </button>
                </div>
              )
            )}
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap justify-between items-end gap-6 mb-4">
          {/* Selector de Almacén */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700">Almacén</label>
            <select
              value={almacenId}
              onChange={e => setAlmacenId(e.target.value)}
              className="border rounded px-2 py-1 w-52"
              disabled={isAsignandoStock || isAsignandoMinMax}
            >
              <option value="0">-- Seleccione --</option>
              {almacenes.map(a => (
                <option key={a.id} value={a.id}>{a.nombre}</option>
              ))}
            </select>
          </div>

          {/* Búsqueda */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700">Buscar Artículo</label>
            <input
              type="text"
              className="border rounded px-3 py-1"
              style={{ width: '350px' }}
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              disabled={isAsignandoStock || isAsignandoMinMax}
              placeholder="Búsqueda en tiempo real"
            />
          </div>
        </div>

        <DataTable
          columns={columns}
          data={inventario}
          customStyles={customStyles}
          pagination={false}
          progressPending={loading}
          progressComponent={<div className="p-4">Cargando inventario...</div>}
          noDataComponent={
            almacenId === '0'
              ? <div className="p-4">Elige un almacén para ver sus productos.</div>
              : <div className="p-4">No se encontraron artículos.</div>
          }
          highlightOnHover
          pointerOnHover
        />
      </div>
    </MainLayout>
  );
}
