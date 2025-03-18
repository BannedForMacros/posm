import React, { useState, useEffect } from 'react';
import ModalGrande from '@/Components/ui/ModalGrande';
import Swal from 'sweetalert2';

const ViewModal = ({ isOpen, onClose, compra }) => {
  const [detalles, setDetalles] = useState([]);
  const [loading, setLoading] = useState(false);

  // Mapeo para convertir el id del tipo de documento a su descripción
  const tipoDocumentoMapping = {
    1: 'Factura',
    2: 'Boleta',
    3: 'Otro'
  };

  // Función para formatear la fecha
  const formatFecha = (fechaString) => {
    if (!fechaString) return '';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(fechaString).toLocaleDateString('es-ES', options);
  };

  // Función para formatear moneda
  const formatMoneda = (valor) => {
    return `S/ ${parseFloat(valor || 0).toFixed(2)}`;
  };

  // Concatenar serie y documento
  const documentoConcatenado =
    compra?.num_serie && compra?.num_documento
      ? `${compra.num_serie} - ${compra.num_documento}`
      : 'Sin número';

  // Determinar la descripción del tipo de documento
  const tipoDocumentoDescripcion =
    tipoDocumentoMapping[compra?.tipo_documento] || 'Documento';

  // Cargar detalles si no vienen en "compra.detalles"
  useEffect(() => {
    if (!compra) return;

    if (Array.isArray(compra.detalles) && compra.detalles.length > 0) {
      setDetalles(compra.detalles);
    } else if (compra.id) {
      setLoading(true);
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
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [compra]);

  // Calcular total (sin IGV)
  const calcularTotal = () => {
    let total = 0;
    detalles.forEach((detalle) => {
      const cantidad = parseFloat(detalle.cantidad) || 0;
      const precioUnitario = parseFloat(detalle.precio_unitario) || 0;
      total += cantidad * precioUnitario;
    });
    return total.toFixed(2);
  };

  const totalCalculado = calcularTotal();

  if (!compra) return null;

  return (
    <ModalGrande
      isOpen={isOpen}
      onClose={onClose}
      // Título del modal (tipo de doc, número concatenado y fecha)
      title={`${tipoDocumentoDescripcion} - ${documentoConcatenado} | ${formatFecha(compra.fecha)}`}
    >
      <div className="p-4 space-y-6 bg-white rounded-lg">
        {/* Cabecera con información principal */}
        <div className="border-b pb-4">
          <div className="flex justify-between items-start">
            {/* Información del Proveedor */}
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-gray-800">Información del Proveedor</h3>
              <p className="text-gray-700">
                <span className="font-semibold">Nombre: </span>
                {compra.nombre_proveedor || 'N/A'}
              </p>
              <p className="text-gray-700">
                <span className="font-semibold">RUC: </span>
                {compra.ruc_proveedor || 'N/A'}
              </p>
            </div>

            {/* Detalles del Documento */}
            <div className="text-right space-y-1">
              <h3 className="text-lg font-bold text-gray-800">Detalles del Documento</h3>
              <p className="text-gray-700">
                <span className="font-semibold">Tipo de Documento: </span>
                {tipoDocumentoDescripcion}
              </p>
              {/* Se quita el campo "Estado" y la "Fecha" que había antes */}
            </div>
          </div>
        </div>

        {/* Tabla de detalles */}
        <div className="overflow-x-auto">
          <h3 className="text-lg font-bold text-gray-800 mb-2">Detalle de Productos</h3>
          {loading ? (
            <div className="py-8 text-center">
              <svg
                className="animate-spin h-8 w-8 mx-auto text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <p className="mt-2 text-gray-600">Cargando detalles...</p>
            </div>
          ) : (
            <table className="w-full text-sm border rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-3 text-left font-semibold text-gray-700 border-b">Artículo</th>
                  <th className="p-3 text-center font-semibold text-gray-700 border-b">Cantidad</th>
                  <th className="p-3 text-right font-semibold text-gray-700 border-b">P. Unitario</th>
                  <th className="p-3 text-right font-semibold text-gray-700 border-b">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {detalles.length > 0 ? (
                  detalles.map((detalle, index) => {
                    const qty = parseFloat(detalle.cantidad) || 0;
                    const pu = parseFloat(detalle.precio_unitario) || 0;
                    const subtotal = (qty * pu).toFixed(2);

                    return (
                      <tr
                        key={index}
                        className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}
                      >
                        <td className="p-3 border-r">
                          <div className="font-medium text-gray-800">
                            {detalle.nombre_articulo || 'Artículo no especificado'}
                          </div>
                          {detalle.descripcion && (
                            <div className="text-xs text-gray-500 mt-1">
                              {detalle.descripcion}
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-center border-r">{qty}</td>
                        <td className="p-3 text-right border-r font-medium">
                          {formatMoneda(pu)}
                        </td>
                        <td className="p-3 text-right font-medium">
                          {formatMoneda(subtotal)}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-500">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-10 w-10 mx-auto text-gray-300 mb-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <p>No hay detalles para esta compra.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Resumen financiero (sin IGV) */}
        <div className="flex justify-end mt-4">
          <div className="w-64 space-y-2 border-t pt-2">
            <div className="flex justify-between text-lg font-bold text-gray-800">
              <span>Total:</span>
              <span>
                {compra.valor_compra
                  ? formatMoneda(compra.valor_compra)
                  : formatMoneda(totalCalculado)}
              </span>
            </div>
          </div>
        </div>

        {/* Sección de observaciones (si existen) */}
        {compra.observaciones && (
          <div className="border-t pt-4">
            <h3 className="text-gray-700 font-semibold mb-1">Observaciones:</h3>
            <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
              {compra.observaciones}
            </p>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex justify-end pt-4 gap-3 border-t">
          <button
            onClick={() => {
              // Aquí iría la lógica para descargar o imprimir
              Swal.fire('Información', 'Función de impresión no implementada', 'info');
            }}
            className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg font-medium transition-colors flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
            Imprimir
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </ModalGrande>
  );
};

export default ViewModal;
