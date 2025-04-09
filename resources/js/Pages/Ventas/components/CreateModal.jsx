import React, { useState, useEffect, useRef } from 'react';
import ModalGrande from '@/Components/ui/ModalGrande';
import Swal from 'sweetalert2';
import IconButton from '@/Components/ui/IconButton';
import { XCircle, Plus, Search } from 'lucide-react';

// En este ejemplo, NO tenemos un SearchClienteModal,
// sino un input simple para nombreCliente o docCliente.
import SearchArticuloModal from './SearchArticuloModal';

const CreateSaleModal = ({ isOpen, onClose, onCreated }) => {
  const token =
    document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ||
    '';

  // Estado principal de la venta con fecha por defecto (fecha actual)
  const [nuevaVenta, setNuevaVenta] = useState({
    cod_documento: '01', // "01"=Factura, "03"=Boleta, etc.
    seri_venta: '',
    nume_venta: '',
    // Se asigna la fecha actual en formato yyyy-mm-dd
    fecha: new Date().toISOString().split('T')[0],
    // Usamos campos manuales para el cliente
    cliente_nombre: '',
    cliente_documento: '',
    total_venta: '0.00',
    detalles: []
  });

  // Almacén (por si necesitas)
  const [almacenId, setAlmacenId] = useState('');
  const [almacenes, setAlmacenes] = useState([]);

  // Para modal de artículo
  const [isArticuloModalOpen, setIsArticuloModalOpen] = useState(false);

  // Índice del detalle en edición
  const [detalleIndexEnEdicion, setDetalleIndexEnEdicion] = useState(null);

  // Refs para focus en “cantidad”
  const cantidadRefs = useRef([]);

  // Efecto: al abrir modal => cargar almacenes, etc.
  useEffect(() => {
    if (isOpen) {
      // Puedes resetear o cargar datos si lo deseas
      cargarAlmacenes();
    }
  }, [isOpen]);

  // Recalcular total cuando cambian los detalles
  useEffect(() => {
    let sum = 0;
    nuevaVenta.detalles.forEach((det) => {
      const qty = parseFloat(det.cantidad) || 0;
      const pu = parseFloat(det.precio_unitario) || 0;
      sum += qty * pu;
    });
    setNuevaVenta((prev) => ({ ...prev, total_venta: sum.toFixed(2) }));
  }, [nuevaVenta.detalles]);

  // Cargar almacenes
  const cargarAlmacenes = async () => {
    try {
      const res = await fetch('/api/almacenes');
      const data = await res.json();
      setAlmacenes(data);
    } catch (error) {
      console.error('Error al cargar almacenes:', error);
    }
  };

  // ===== DETALLES =====
  const agregarDetalle = () => {
    setNuevaVenta((prev) => ({
      ...prev,
      detalles: [
        ...prev.detalles,
        {
          cod_articulo: '',
          nombre_articulo: '',
          cantidad: '',
          precio_unitario: ''
        }
      ]
    }));
  };

  const eliminarDetalle = (index) => {
    setNuevaVenta((prev) => {
      const copia = [...prev.detalles];
      copia.splice(index, 1);
      return { ...prev, detalles: copia };
    });
  };

  const handleChangeDetalle = (index, field, value) => {
    setNuevaVenta((prev) => {
      const copia = [...prev.detalles];
      copia[index] = { ...copia[index], [field]: value };
      return { ...prev, detalles: copia };
    });
  };

  // ===== ARTÍCULO =====
  const handleSearchArticulo = (index) => {
    setDetalleIndexEnEdicion(index);
    setIsArticuloModalOpen(true);
  };

  const handleSelectArticulo = (art) => {
    setNuevaVenta((prev) => {
      const copia = [...prev.detalles];
      copia[detalleIndexEnEdicion] = {
        ...copia[detalleIndexEnEdicion],
        cod_articulo: art.codarticulo,
        nombre_articulo: art.nombrearticulo || art.nombrecorto
      };
      return { ...prev, detalles: copia };
    });
    setIsArticuloModalOpen(false);

    // Focus en “cantidad”
    setTimeout(() => {
      if (cantidadRefs.current[detalleIndexEnEdicion]) {
        cantidadRefs.current[detalleIndexEnEdicion].focus();
      }
    }, 100);
  };

  // ===== CREAR VENTA =====
  const handleCrearVenta = async () => {
    // Validaciones mínimas
    if (!nuevaVenta.cod_documento) {
      Swal.fire('Advertencia', 'Seleccione un tipo de documento', 'warning');
      return;
    }
    if (!nuevaVenta.fecha) {
      Swal.fire('Advertencia', 'Ingrese la fecha de la venta', 'warning');
      return;
    }
    if (!nuevaVenta.cliente_nombre) {
      Swal.fire('Advertencia', 'Ingrese el nombre del cliente', 'warning');
      return;
    }
    if (nuevaVenta.detalles.length === 0) {
      Swal.fire('Advertencia', 'Debe agregar al menos un detalle', 'warning');
      return;
    }
    if (!almacenId) {
      Swal.fire('Advertencia', 'Seleccione un almacén de salida', 'warning');
      return;
    }

    try {
      // Armamos payload
      const payload = {
        cod_documento: nuevaVenta.cod_documento,
        seri_venta: nuevaVenta.seri_venta,
        nume_venta: nuevaVenta.nume_venta,
        fecha: nuevaVenta.fecha,
        cliente_nombre: nuevaVenta.cliente_nombre,
        cliente_documento: nuevaVenta.cliente_documento,
        total_venta: nuevaVenta.total_venta,
        detalles: nuevaVenta.detalles.map((det) => ({
          cod_articulo: det.cod_articulo,
          cantidad: det.cantidad,
          precio_unitario: det.precio_unitario
        })),
        generar_almacen: true,
        almacen_id: parseInt(almacenId, 10)
      };

      const res = await fetch('/api/ventas', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': token
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const msg = await res.json();
        throw new Error(msg.message || 'Error al crear la venta');
      }

      const data = await res.json();
      Swal.fire('Éxito', data.message || 'Venta creada correctamente', 'success');

      if (onCreated) onCreated();
      onClose();
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    }
  };

  // ===== RENDER =====
  return (
    <ModalGrande isOpen={isOpen} onClose={onClose} title="Crear Nueva Venta">
      <div className="w-full mx-auto space-y-6 p-4">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Columna Izquierda */}
          <div className="w-full lg:w-1/3 space-y-4 min-w-[400px]">
            {/* Tipo Documento + Fecha */}
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-sm font-semibold">Tipo Doc:</span>
                <select
                  className="mt-1 block w-full border rounded p-2"
                  value={nuevaVenta.cod_documento}
                  onChange={(e) =>
                    setNuevaVenta({
                      ...nuevaVenta,
                      cod_documento: e.target.value
                    })
                  }
                >
                  <option value="">Seleccione...</option>
                  <option value="01">Factura</option>
                  <option value="03">Boleta</option>
                  <option value="XX">Otro</option>
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-semibold">Fecha:</span>
                <input
                  type="date"
                  className="mt-1 block w-full border p-2"
                  value={nuevaVenta.fecha}
                  onChange={(e) =>
                    setNuevaVenta({
                      ...nuevaVenta,
                      fecha: e.target.value
                    })
                  }
                />
              </label>
            </div>

            {/* Serie + Número */}
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-sm font-semibold">Serie:</span>
                <input
                  type="text"
                  className="mt-1 block w-full border p-2"
                  value={nuevaVenta.seri_venta}
                  onChange={(e) =>
                    setNuevaVenta({
                      ...nuevaVenta,
                      seri_venta: e.target.value
                    })
                  }
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold">Correlativo:</span>
                <input
                  type="text"
                  className="mt-1 block w-full border p-2"
                  value={nuevaVenta.nume_venta}
                  onChange={(e) =>
                    setNuevaVenta({
                      ...nuevaVenta,
                      nume_venta: e.target.value
                    })
                  }
                />
              </label>
            </div>

            {/* Almacén (salida) */}
            <div>
              <label className="block text-sm font-semibold mb-1">Almacén</label>
              <select
                className="mt-1 block w-full border rounded p-2"
                value={almacenId}
                onChange={(e) => setAlmacenId(e.target.value)}
              >
                <option value="">Seleccione...</option>
                {almacenes.map((alm) => (
                  <option key={alm.id} value={alm.id}>
                    {alm.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Cliente Manual */}
            <div>
              <label className="block text-sm font-semibold">Nombre Cliente</label>
              <input
                type="text"
                className="mt-1 block w-full border p-2"
                placeholder="Ej: Juan Perez"
                value={nuevaVenta.cliente_nombre}
                onChange={(e) =>
                  setNuevaVenta({
                    ...nuevaVenta,
                    cliente_nombre: e.target.value
                  })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-semibold">Documento Cliente</label>
              <input
                type="text"
                className="mt-1 block w-full border p-2"
                placeholder="Ej: 12345678"
                value={nuevaVenta.cliente_documento}
                onChange={(e) =>
                  setNuevaVenta({
                    ...nuevaVenta,
                    cliente_documento: e.target.value
                  })
                }
              />
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
                  {nuevaVenta.detalles.map((det, idx) => {
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
                            onChange={(e) =>
                              handleChangeDetalle(idx, 'cantidad', e.target.value)
                            }
                          />
                        </td>
                        <td className="p-1">
                          <input
                            type="number"
                            step="0.01"
                            className="border rounded p-1 w-full text-xs text-right"
                            value={det.precio_unitario}
                            onChange={(e) =>
                              handleChangeDetalle(idx, 'precio_unitario', e.target.value)
                            }
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
                  {nuevaVenta.detalles.length === 0 && (
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
              <span className="text-sm font-semibold">Total Venta (S/):</span>
              <input
                type="text"
                readOnly
                className="mt-1 block w-full border p-2 text-right bg-gray-100"
                value={nuevaVenta.total_venta}
              />
            </label>
          </div>
        </div>

        {/* Botones Finales */}
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
            onClick={handleCrearVenta}
          >
            Guardar
          </button>
        </div>
      </div>

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

export default CreateSaleModal;
