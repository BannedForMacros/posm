import React, { useState, useEffect } from 'react';
import ModalGrande from '@/Components/ui/ModalGrande'; // tu modal ancho
import Swal from 'sweetalert2';
import IconButton from '@/Components/ui/IconButton';
import { XCircle, Plus, Search } from 'lucide-react';

// Ejemplos de modales de búsqueda (placeholders)
import SearchProveedorModal from './SearchProveedorModal';
import SearchArticuloModal from './SearchArticuloModal';

const CreateModal = ({ isOpen, onClose, onCreated }) => {
  // CSRF token
  const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

  // Estado de la nueva compra
  const [nuevaCompra, setNuevaCompra] = useState({
    tipo_documento: '',
    fecha: '',
    num_serie: '',
    num_documento: '',
    cod_proveedor: '',
    nombre_proveedor: '',
    valor_compra: '0.00', // Valor total calculado
    detalles: [],
  });

  // Modales para buscar Proveedor / Artículo
  const [isProveedorModalOpen, setIsProveedorModalOpen] = useState(false);
  const [isArticuloModalOpen, setIsArticuloModalOpen] = useState(false);

  // Índice del detalle que estamos editando (para asignar artículo)
  const [detalleIndexEnEdicion, setDetalleIndexEnEdicion] = useState(null);

  // Al cambiar los detalles, recalculamos el total
  useEffect(() => {
    let sum = 0;
    nuevaCompra.detalles.forEach(det => {
      const qty = parseFloat(det.cantidad) || 0;
      const pu = parseFloat(det.precio_unitario) || 0;
      sum += qty * pu;
    });
    setNuevaCompra(prev => ({
      ...prev,
      valor_compra: sum.toFixed(2)
    }));
  }, [nuevaCompra.detalles]);

  // Funciones para manejar DETALLES
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

  // Abrir modal de búsqueda de Proveedor
  const handleSearchProveedor = () => {
    setIsProveedorModalOpen(true);
  };

  // Cuando seleccionas un proveedor en SearchProveedorModal
  const handleSelectProveedor = (proveedor) => {
    setNuevaCompra(prev => ({
      ...prev,
      cod_proveedor: proveedor.id,
      nombre_proveedor: proveedor.razon_social,
    }));
    setIsProveedorModalOpen(false);
  };

  // Abrir modal de búsqueda de Artículo para un DETALLE en particular
  const handleSearchArticulo = (index) => {
    setDetalleIndexEnEdicion(index);
    setIsArticuloModalOpen(true);
  };

  // Cuando seleccionas un artículo en SearchArticuloModal
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
  };

  // Crear la compra (con validaciones front-end)
  const handleCrearCompra = async () => {
    // 1) Validaciones: TipoDoc, Fecha, Proveedor, Detalles
    if (!nuevaCompra.tipo_documento) {
      Swal.fire({
        icon: 'warning',
        title: 'Campo Requerido',
        text: 'Por favor seleccione un Tipo de Documento'
      });
      return;
    }

    if (!nuevaCompra.fecha) {
      Swal.fire({
        icon: 'warning',
        title: 'Campo Requerido',
        text: 'Por favor ingrese la Fecha de la compra'
      });
      return;
    }

    if (!nuevaCompra.cod_proveedor) {
      Swal.fire({
        icon: 'warning',
        title: 'Proveedor Requerido',
        text: 'Debe seleccionar un proveedor antes de guardar'
      });
      return;
    }

    if (nuevaCompra.detalles.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Sin Detalles',
        text: 'Debe agregar al menos un detalle de compra'
      });
      return;
    }

    // Opcional: validar que cada detalle tenga cod_articulo
    const algunDetalleSinArticulo = nuevaCompra.detalles.some(d => !d.cod_articulo);
    if (algunDetalleSinArticulo) {
      Swal.fire({
        icon: 'warning',
        title: 'Artículo Requerido',
        text: 'Todos los detalles deben tener un artículo seleccionado'
      });
      return;
    }

    try {
      // Filtrar campos que no requiera el SP (nombre_proveedor, etc.)
      const dataToSend = {
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
      };

      const response = await fetch('/api/facturacion', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': token
        },
        body: JSON.stringify(dataToSend),
      });
  
      if (!response.ok) {
        const msg = await response.json();
        throw new Error(msg.message || 'Error al crear la compra');
      }
  
      // Éxito - Usar SweetAlert
      const data = await response.json();
      Swal.fire({
        icon: 'success',
        title: 'Compra creada',
        text: data.message || 'La compra se registró correctamente',
        showConfirmButton: false,
        timer: 1500
      });
  
      if (onCreated) onCreated(); // Esto debe disparar la recarga de datos
      onClose();
  
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message,
      });
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
                  <option value="1">Factura</option>
                  <option value="2">Boleta</option>
                  <option value="3">Otro</option>
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
                  type="number"
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

          {/* Columna Derecha: Tabla de Detalles */}
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

        {/* Sección para mostrar el Valor Total */}
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

      {/* Modal para Buscar Proveedor */}
      {isProveedorModalOpen && (
        <SearchProveedorModal
          isOpen={isProveedorModalOpen}
          onClose={() => setIsProveedorModalOpen(false)}
          onSelect={handleSelectProveedor}
        />
      )}

      {/* Modal para Buscar Artículo */}
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
