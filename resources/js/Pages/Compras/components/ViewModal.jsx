import React, { useState, useEffect } from 'react';
import ModalGrande from '@/Components/ui/ModalGrande';
import Swal from 'sweetalert2';

const ViewModal = ({ isOpen, onClose, compra }) => {
  // Estado local para los detalles (si no vienen en compra)
  const [detalles, setDetalles] = useState([]);

  // Formatear fecha
  const formatFecha = (fechaString) => {
    if (!fechaString) return 'N/A';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(fechaString).toLocaleDateString('es-ES', options);
  };

  // Al montar (y cada vez que cambie "compra"), si "compra.detalles" no existe,
  // hacemos fetch a /api/detalle-facturacion?facturacion_id=...
  useEffect(() => {
    if (!compra) return; // si no hay compra, no hacemos nada
    // Si ya viene "compra.detalles", lo usamos
    if (Array.isArray(compra.detalles)) {
      setDetalles(compra.detalles);
    } else {
      // Caso contrario, hacemos fetch
      if (compra.id) {
        fetch(`/api/detalle-facturacion?facturacion_id=${compra.id}`)
          .then((res) => {
            if (!res.ok) {
              throw new Error('Error al obtener detalles');
            }
            return res.json();
          })
          .then((data) => {
            setDetalles(data);
          })
          .catch((err) => {
            console.error(err);
            Swal.fire('Error', err.message, 'error');
          });
      }
    }
  }, [compra]);

  if (!compra) return null;

  return (
    <ModalGrande isOpen={isOpen} onClose={onClose} title={`Detalle de Compra #${compra.num_documento || ''}`}>
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Columna Izquierda */}
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-3">Información de la Compra</h3>
              <div className="space-y-2">
                {/* Tipo de Documento (fila simple) */}
                <div className="grid grid-cols-1">
                  <label className="text-sm font-medium text-gray-600">Tipo de Documento:</label>
                  <p className="mt-1 p-2 bg-gray-100 rounded">{compra.tipo_documento || 'N/A'}</p>
                </div>

                {/* N° Serie y N° Documento en la misma fila */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-sm font-medium text-gray-600">N° Serie:</label>
                    <p className="mt-1 p-2 bg-gray-100 rounded">{compra.num_serie || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">N° Documento:</label>
                    <p className="mt-1 p-2 bg-gray-100 rounded">{compra.num_documento || 'N/A'}</p>
                  </div>
                </div>

                {/* Fecha */}
                <div>
                  <label className="text-sm font-medium text-gray-600">Fecha de Emisión:</label>
                  <p className="mt-1 p-2 bg-gray-100 rounded">{formatFecha(compra.fecha)}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-3">Datos del Proveedor</h3>
              <div className="space-y-2">
                {/* Razón Social y RUC en la misma fila */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Razón Social:</label>
                    <p className="mt-1 p-2 bg-gray-100 rounded">{compra.nombre_proveedor || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">RUC del Proveedor:</label>
                    <p className="mt-1 p-2 bg-gray-100 rounded">{compra.ruc_proveedor || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Columna Derecha - Detalles */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-4">Detalles de los Artículos</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="p-2 text-left">Artículo</th>
                    <th className="p-2 text-right">Cantidad</th>
                    <th className="p-2 text-right">P. Unitario</th>
                    <th className="p-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                
                <tbody>
                  {detalles.length > 0 ? (
                    detalles.map((detalle, index) => {
                      const qty = parseFloat(detalle.cantidad) || 0;
                      const pu = parseFloat(detalle.precio_unitario) || 0;
                      const subtotal = (qty * pu).toFixed(2);

                      return (
                        <tr key={index} className="border-b border-gray-200 hover:bg-gray-100">
                          <td className="p-2">
                            {detalle.nombre_articulo || 'Artículo no especificado'}
                          </td>
                          <td className="p-2 text-right">{qty}</td>
                          <td className="p-2 text-right">
                            S/ {pu.toFixed(2)}
                          </td>
                          <td className="p-2 text-right font-medium">
                            S/ {subtotal}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="text-center p-4 text-gray-500">
                        No hay detalles para esta compra.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Total */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-lg">Total General:</span>
                <span className="text-xl font-bold text-blue-700">
                  S/ {parseFloat(compra.valor_compra || 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Botón de Cierre */}
        <div className="mt-6 flex justify-end border-t pt-4">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition-colors"
          >
            Cerrar Vista
          </button>
        </div>
      </div>
    </ModalGrande>
  );
};

export default ViewModal;

