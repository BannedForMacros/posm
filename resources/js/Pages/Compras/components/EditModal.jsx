// EditModal.jsx — edición completa de la compra: fecha + productos (cantidad/precio).
// El tipo de documento, serie/número y proveedor se muestran de solo-lectura porque el
// SP de actualización (sp_actualizarFacturacion) solo modifica fecha y valor. Para hacerlos
// editables habría que ampliar ese SP en el backend.
import React, { useState, useEffect, useRef } from 'react';
import ModalGrande from '@/Components/ui/ModalGrande';
import IconButton from '@/Components/ui/IconButton';
import { XCircle, Plus, Search } from 'lucide-react';
import Swal from 'sweetalert2';
import SearchArticuloModal from './SearchArticuloModal';

const EditModal = ({ isOpen, onClose, compra, editarCompraFn }) => {
  const [fecha, setFecha] = useState('');
  const [detalles, setDetalles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isArticuloModalOpen, setIsArticuloModalOpen] = useState(false);
  const [detalleIndexEnEdicion, setDetalleIndexEnEdicion] = useState(null);
  const cantidadRefs = useRef([]);

  // Cargar cabecera + detalles al abrir
  useEffect(() => {
    if (!compra) return;
    setFecha(compra.fecha ? String(compra.fecha).slice(0, 10) : '');
    setLoading(true);
    fetch(`/api/detalle-facturacion?facturacion_id=${compra.id}`)
      .then(r => r.json())
      .then(data => {
        const arr = Array.isArray(data) ? data : [];
        setDetalles(arr.map(d => ({
          cod_articulo: d.cod_articulo,
          nombre_articulo: d.nombre_articulo,
          cantidad: String(d.cantidad),
          precio_unitario: String(d.precio_unitario),
        })));
      })
      .catch(() => setDetalles([]))
      .finally(() => setLoading(false));
  }, [compra]);

  const total = detalles.reduce(
    (acc, d) => acc + (parseFloat(d.cantidad) || 0) * (parseFloat(d.precio_unitario) || 0),
    0
  );

  const handleChangeDetalle = (index, field, value) => {
    setDetalles(prev => {
      const copia = [...prev];
      copia[index] = { ...copia[index], [field]: value };
      return copia;
    });
  };
  const eliminarDetalle = (index) => {
    setDetalles(prev => prev.filter((_, i) => i !== index));
  };

  const handleAgregarProducto = () => {
    setDetalleIndexEnEdicion(null);
    setIsArticuloModalOpen(true);
  };
  const handleSelectArticulo = (art) => {
    let focusIdx;
    setDetalles(prev => {
      const copia = [...prev];
      if (detalleIndexEnEdicion === null) {
        const existente = copia.findIndex(d => String(d.cod_articulo) === String(art.codarticulo));
        if (existente >= 0) {
          const cant = parseFloat(copia[existente].cantidad) || 0;
          copia[existente] = { ...copia[existente], cantidad: String(cant + 1) };
          focusIdx = existente;
        } else {
          copia.push({
            cod_articulo: art.codarticulo,
            nombre_articulo: art.nombrearticulo || art.nombrecorto,
            cantidad: '1',
            precio_unitario: '',
          });
          focusIdx = copia.length - 1;
        }
      } else {
        copia[detalleIndexEnEdicion] = {
          ...copia[detalleIndexEnEdicion],
          cod_articulo: art.codarticulo,
          nombre_articulo: art.nombrearticulo || art.nombrecorto,
        };
        focusIdx = detalleIndexEnEdicion;
      }
      return copia;
    });
    setIsArticuloModalOpen(false);
    setTimeout(() => {
      if (focusIdx != null && cantidadRefs.current[focusIdx]) {
        cantidadRefs.current[focusIdx].focus();
        cantidadRefs.current[focusIdx].select?.();
      }
    }, 100);
  };

  const handleUpdate = async () => {
    if (!fecha) {
      Swal.fire('Advertencia', 'Ingrese la fecha de la compra', 'warning');
      return;
    }
    if (detalles.length === 0) {
      Swal.fire('Advertencia', 'La compra debe tener al menos un producto', 'warning');
      return;
    }
    const incompletos = detalles.some(
      d => !d.cod_articulo || !(parseFloat(d.cantidad) > 0) || d.precio_unitario === ''
    );
    if (incompletos) {
      Swal.fire('Advertencia', 'Completa artículo, cantidad y precio en todas las filas', 'warning');
      return;
    }

    await editarCompraFn(compra.id, {
      fecha,
      valor_compra: total.toFixed(2),
      detalles: detalles.map(d => ({
        cod_articulo: d.cod_articulo,
        cantidad: d.cantidad,
        precio_unitario: d.precio_unitario,
      })),
    });
    onClose();
  };

  if (!compra) return null;

  return (
    <ModalGrande isOpen={isOpen} onClose={onClose} title="Editar Compra">
      <div className="space-y-6 p-4">
        {/* Cabecera (solo lectura) + fecha (editable) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <label className="block">
            <span className="text-sm font-semibold">Tipo de documento:</span>
            <input
              type="text" readOnly
              className="mt-1 block w-full border rounded p-2 bg-gray-100"
              value={compra.tipo_documento_descripcion || '—'}
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold">Comprobante:</span>
            <input
              type="text" readOnly
              className="mt-1 block w-full border rounded p-2 bg-gray-100"
              value={`${compra.num_serie || ''} - ${compra.num_documento || ''}`}
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold">Proveedor:</span>
            <input
              type="text" readOnly
              className="mt-1 block w-full border rounded p-2 bg-gray-100"
              value={compra.nombre_proveedor || '—'}
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold">Fecha:</span>
            <input
              type="date"
              className="mt-1 block w-full border rounded p-2"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </label>
        </div>

        {/* Productos */}
        <div>
          <div className="flex justify-between items-center gap-2 flex-wrap">
            <h2 className="font-bold text-lg">Productos</h2>
            <button
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 transition"
              onClick={handleAgregarProducto}
            >
              <Plus size={16} />
              Agregar producto
            </button>
          </div>

          <div className="mt-2 overflow-x-auto overflow-y-auto border rounded p-2 min-h-[180px] max-h-[45vh] bg-white">
            <table className="w-full text-xs">
              <thead className="text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="p-1 w-[40%] text-left">Artículo</th>
                  <th className="p-1 w-[15%] text-right">Cantidad</th>
                  <th className="p-1 w-[20%] text-right">P. Unitario</th>
                  <th className="p-1 w-[15%] text-right">Subtotal</th>
                  <th className="p-1 w-[10%] text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {detalles.map((det, idx) => {
                  const subtotal = ((parseFloat(det.cantidad) || 0) * (parseFloat(det.precio_unitario) || 0)).toFixed(2);
                  return (
                    <tr key={idx} className="hover:bg-gray-50 even:bg-gray-50">
                      <td className="p-1">
                        <div className="flex items-center gap-1">
                          <input
                            type="text" readOnly
                            className="border rounded p-1 w-full text-xs"
                            placeholder="(Artículo)"
                            value={det.nombre_articulo || ''}
                          />
                          <IconButton
                            icon={Search}
                            label="Cambiar artículo"
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
                          type="number" step="0.01"
                          className="border rounded p-1 w-full text-xs text-right"
                          value={det.cantidad}
                          onChange={(e) => handleChangeDetalle(idx, 'cantidad', e.target.value)}
                        />
                      </td>
                      <td className="p-1">
                        <input
                          type="number" step="0.01"
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
                {!loading && detalles.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-gray-400">
                      No hay productos. Usa “Agregar producto”.
                    </td>
                  </tr>
                )}
                {loading && (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-gray-400">Cargando productos...</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Total */}
        <div className="flex justify-end">
          <div className="w-full md:w-1/3">
            <label className="block text-right">
              <span className="text-sm font-semibold">Valor Total (S/):</span>
              <input
                type="text" readOnly
                className="mt-1 block w-full border rounded p-2 text-right bg-gray-100"
                value={total.toFixed(2)}
              />
            </label>
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3 border-t bg-gray-50 p-4">
          <button
            type="button"
            className="rounded bg-gray-400 px-4 py-2 text-white transition hover:bg-gray-500"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="rounded bg-green-600 px-4 py-2 text-white transition hover:bg-green-700"
            onClick={handleUpdate}
          >
            Actualizar
          </button>
        </div>
      </div>

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

export default EditModal;
