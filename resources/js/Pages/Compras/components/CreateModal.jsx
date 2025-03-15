import React, { useState, useEffect, useRef } from 'react';
import ModalGrande from '@/Components/ui/ModalGrande'; 
import Swal from 'sweetalert2';
import IconButton from '@/Components/ui/IconButton';
import { XCircle, Plus, Search } from 'lucide-react';

// Placeholders para modales
import SearchProveedorModal from './SearchProveedorModal';
import SearchArticuloModal from './SearchArticuloModal';

const CreateModal = ({ isOpen, onClose, onCreated }) => {
  const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

  // ======== ESTADOS PRINCIPALES =========
  const [nuevaCompra, setNuevaCompra] = useState({
    tipo_documento: '',
    fecha: '',
    num_serie: '',         // seguirá siendo string, ahora en el input será text
    num_documento: '',
    cod_proveedor: '',
    nombre_proveedor: '',
    valor_compra: '0.00',
    detalles: [],
  });

  const [almacenId, setAlmacenId] = useState('');
  const [almacenes, setAlmacenes] = useState([]);
  const [tipoDocumentos, setTipoDocumentos] = useState([]); // Estado para tipos de documento

  // Modales de búsqueda
  const [isProveedorModalOpen, setIsProveedorModalOpen] = useState(false);
  const [isArticuloModalOpen, setIsArticuloModalOpen] = useState(false);

  // Índice del detalle en edición
  const [detalleIndexEnEdicion, setDetalleIndexEnEdicion] = useState(null);

  // Referencias para hacer focus en la cantidad
  const cantidadRefs = useRef([]);

  // Cargar almacenes y tipos de documento al abrir
  useEffect(() => {
    if (isOpen) {
      cargarAlmacenes();
      cargarTipoDocumentos();
    }
  }, [isOpen]);

  // Recalcular total
  useEffect(() => {
    let sum = 0;
    nuevaCompra.detalles.forEach(det => {
      const qty = parseFloat(det.cantidad) || 0;
      const pu = parseFloat(det.precio_unitario) || 0;
      sum += qty * pu;
    });
    setNuevaCompra(prev => ({ ...prev, valor_compra: sum.toFixed(2) }));
  }, [nuevaCompra.detalles]);

  const cargarAlmacenes = async () => {
    try {
      const res = await fetch('/api/almacenes');
      const data = await res.json();
      setAlmacenes(data);
    } catch (error) {
      console.error('Error al cargar almacenes:', error);
    }
  };

  const cargarTipoDocumentos = async () => {
    try {
      const res = await fetch('/api/tipo_documento'); // Ajusta la URL si es necesario
      const data = await res.json();
      setTipoDocumentos(data);
    } catch (error) {
      console.error('Error al cargar tipos de documento:', error);
    }
  };

  // Manejo de detalles
  const agregarDetalle = () => {
    setNuevaCompra(prev => ({
      ...prev,
      detalles: [
        ...prev.detalles,
        { cod_articulo: '', nombre_articulo: '', cantidad: '', precio_unitario: '' },
      ],
    }));
  };

  const eliminarDetalle = (index) => {
    setNuevaCompra(prev => {
      const copia = [...prev.detalles];
      copia.splice(index, 1);
      return { ...prev, detalles: copia };
    });
  };

  const handleChangeDetalle = (index, field, value) => {
    setNuevaCompra(prev => {
      const copia = [...prev.detalles];
      copia[index] = { ...copia[index], [field]: value };
      return { ...prev, detalles: copia };
    });
  };

  // Buscar Proveedor
  const handleSearchProveedor = () => setIsProveedorModalOpen(true);
  const handleSelectProveedor = (prov) => {
    setNuevaCompra(prev => ({
      ...prev,
      cod_proveedor: prov.id,
      nombre_proveedor: prov.razon_social,
    }));
    setIsProveedorModalOpen(false);
  };

  // Buscar Artículo
  const handleSearchArticulo = (index) => {
    setDetalleIndexEnEdicion(index);
    setIsArticuloModalOpen(true);
  };
  const handleSelectArticulo = (art) => {
    setNuevaCompra(prev => {
      const copia = [...prev.detalles];
      copia[detalleIndexEnEdicion] = {
        ...copia[detalleIndexEnEdicion],
        cod_articulo: art.codarticulo,
        nombre_articulo: art.nombrearticulo || art.nombrecorto,
      };
      return { ...prev, detalles: copia };
    });
    setIsArticuloModalOpen(false);

    // Focus en cantidad
    setTimeout(() => {
      if (cantidadRefs.current[detalleIndexEnEdicion]) {
        cantidadRefs.current[detalleIndexEnEdicion].focus();
      }
    }, 100);
  };

  // Crear compra
  const handleCrearCompra = async () => {
    if (!nuevaCompra.tipo_documento) {
      Swal.fire('Advertencia', 'Seleccione un tipo de documento', 'warning');
      return;
    }
    if (!nuevaCompra.fecha) {
      Swal.fire('Advertencia', 'Ingrese la fecha de la compra', 'warning');
      return;
    }
    if (!nuevaCompra.cod_proveedor) {
      Swal.fire('Advertencia', 'Seleccione un proveedor', 'warning');
      return;
    }
    if (nuevaCompra.detalles.length === 0) {
      Swal.fire('Advertencia', 'Debe agregar al menos un detalle', 'warning');
      return;
    }
    if (!almacenId) {
      Swal.fire('Advertencia', 'Seleccione el almacén donde ingresará la compra', 'warning');
      return;
    }

    try {
      const payload = {
        tipo_documento: nuevaCompra.tipo_documento,
        fecha: nuevaCompra.fecha,
        num_serie: nuevaCompra.num_serie,
        num_documento: nuevaCompra.num_documento,
        cod_proveedor: nuevaCompra.cod_proveedor,
        valor_compra: nuevaCompra.valor_compra,
        detalles: nuevaCompra.detalles.map(det => ({
          cod_articulo: det.cod_articulo,
          cantidad: det.cantidad,
          precio_unitario: det.precio_unitario,
        })),
        generar_almacen: true,
        almacen_id: parseInt(almacenId, 10),
      };

      const res = await fetch('/api/facturacion', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': token
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const msg = await res.json();
        throw new Error(msg.message || 'Error al crear la compra');
      }

      const data = await res.json();
      Swal.fire('Éxito', data.message || 'Compra creada correctamente', 'success');

      if (onCreated) onCreated();
      onClose();

    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    }
  };

  return (
    <ModalGrande isOpen={isOpen} onClose={onClose} title="Crear Nueva Compra">
      <div className="w-full mx-auto space-y-6 p-4">
        
        {/* Contenedor en 2 columnas */}
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* Columna Izquierda (campos) */}
          <div className="w-full lg:w-1/3 space-y-4 min-w-[400px]">
            {/* TipoDocumento + Fecha */}
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-sm font-semibold">Tipo de Documento:</span>
                <select
                  className="mt-1 block w-full border rounded p-2"
                  value={nuevaCompra.tipo_documento}
                  onChange={(e) =>
                    setNuevaCompra({ ...nuevaCompra, tipo_documento: e.target.value })
                  }
                >
                  <option value="">Seleccione...</option>
                  {tipoDocumentos.map(td => (
                    <option key={td.id} value={td.id}>
                      {td.descripcion}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-semibold">Fecha:</span>
                <input
                  type="date"
                  className="mt-1 block w-full border p-2"
                  value={nuevaCompra.fecha}
                  onChange={(e) => setNuevaCompra({ ...nuevaCompra, fecha: e.target.value })}
                />
              </label>
            </div>

            {/* N° Serie + N° Documento */}
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-sm font-semibold">N° Serie:</span>
                <input
                  type="text"
                  className="mt-1 block w-full border p-2"
                  value={nuevaCompra.num_serie}
                  onChange={(e) =>
                    setNuevaCompra({ ...nuevaCompra, num_serie: e.target.value })
                  }
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold">N° Documento:</span>
                <input
                  type="number"
                  className="mt-1 block w-full border p-2"
                  value={nuevaCompra.num_documento}
                  onChange={(e) =>
                    setNuevaCompra({ ...nuevaCompra, num_documento: e.target.value })
                  }
                />
              </label>
            </div>

            {/* Almacén */}
            <div>
              <label className="block text-sm font-semibold mb-1">
                Almacén
              </label>
              <select
                className="mt-1 block w-full border rounded p-2"
                value={almacenId}
                onChange={e => setAlmacenId(e.target.value)}
              >
                <option value="">Seleccione...</option>
                {almacenes.map(alm => (
                  <option key={alm.id} value={alm.id}>
                    {alm.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Proveedor + Buscar */}
            <div className="grid grid-cols-12 gap-3 items-end">
              <div className="col-span-8">
                <label className="block">
                  <span className="text-sm font-semibold">Proveedor:</span>
                  <input
                    type="text"
                    className="mt-1 block w-full border p-2"
                    placeholder="(Seleccione proveedor)"
                    value={nuevaCompra.nombre_proveedor}
                    readOnly
                  />
                </label>
              </div>
              <div className="col-span-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleSearchProveedor}
                  className="mt-1 inline-flex items-center gap-2 rounded bg-gray-500 px-3 py-2 text-white transition hover:bg-gray-600"
                >
                  <Search size={16} />
                  Buscar
                </button>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Detalles */}
          <div className="flex-1 min-w-[600px]">
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-lg">Detalles</h2>
              <button
                className="bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700 transition"
                onClick={agregarDetalle}
              >
                Agregar Detalle
              </button>
            </div>

            <div className="overflow-x-auto border rounded p-2 h-[300px] bg-white">
              <table className="w-full text-xs">
                <thead className="text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th className="p-1 w-[40%]">Artículo</th>
                    <th className="p-1 w-[15%] text-right">Cantidad</th>
                    <th className="p-1 w-[20%] text-right">P. Unitario</th>
                    <th className="p-1 w-[15%] text-right">Subtotal</th>
                    <th className="p-1 w-[10%] text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {nuevaCompra.detalles.map((det, idx) => {
                    const qty = parseFloat(det.cantidad) || 0;
                    const pu = parseFloat(det.precio_unitario) || 0;
                    const subtotal = (qty * pu).toFixed(2);

                    return (
                      <tr key={idx} className="hover:bg-gray-50 even:bg-gray-50">
                        <td className="p-1">
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              className="border rounded p-1 w-full text-xs"
                              placeholder="(Artículo)"
                              readOnly
                              value={det.nombre_articulo || ''}
                            />
                            <IconButton
                              icon={Search}
                              label="Buscar Artículo"
                              variant="info"
                              size="xs"
                              onClick={() => {
                                setDetalleIndexEnEdicion(idx);
                                setIsArticuloModalOpen(true);
                              }}
                            />
                          </div>
                        </td>
                        <td className="p-1">
                          <input
                            ref={(el) => (cantidadRefs.current[idx] = el)} 
                            type="number"
                            step="0.01"
                            className="border rounded p-1 w-full text-xs text-right"
                            value={det.cantidad}
                            onChange={(e) => handleChangeDetalle(idx, 'cantidad', e.target.value)}
                          />
                        </td>
                        <td className="p-1">
                          <input
                            type="number"
                            step="0.01"
                            className="border rounded p-1 w-full text-xs text-right"
                            value={det.precio_unitario}
                            onChange={(e) => handleChangeDetalle(idx, 'precio_unitario', e.target.value)}
                          />
                        </td>
                        <td className="p-1 text-right">{subtotal}</td>
                        <td className="p-1 text-center">
                          <IconButton
                            icon={XCircle}
                            label="Quitar"
                            variant="danger"
                            size="xs"
                            onClick={() => eliminarDetalle(idx)}
                          />
                        </td>
                      </tr>
                    );
                  })}
                  {nuevaCompra.detalles.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-2 text-gray-400">
                        No hay detalles agregados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Valor Total */}
        <div className="flex justify-end">
          <div className="w-full md:w-1/3">
            <label className="block text-right">
              <span className="text-sm font-semibold">Valor Total (S/):</span>
              <input
                type="text"
                readOnly
                className="mt-1 block w-full border p-2 text-right bg-gray-100"
                value={nuevaCompra.valor_compra}
              />
            </label>
          </div>
        </div>

        {/* Botones finales */}
        <div className="flex justify-end space-x-3 mt-4 border-t bg-gray-50 p-4">
          <button
            type="button"
            className="rounded bg-gray-400 px-4 py-2 text-white transition hover:bg-gray-500"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="rounded bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
            onClick={handleCrearCompra}
          >
            Guardar
          </button>
        </div>
      </div>

      {/* Modal Proveedor */}
      {isProveedorModalOpen && (
        <SearchProveedorModal
          isOpen={isProveedorModalOpen}
          onClose={() => setIsProveedorModalOpen(false)}
          onSelect={handleSelectProveedor}
        />
      )}

      {/* Modal Artículo */}
      {isArticuloModalOpen && (
        <SearchArticuloModal
          isOpen={isArticuloModalOpen}
          onClose={() => setIsArticuloModalOpen(false)}
          onSelect={handleSelectArticulo}
        />
      )}
    </ModalGrande>
  );
};

export default CreateModal;
