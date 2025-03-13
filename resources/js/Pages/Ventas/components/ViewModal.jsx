// resources/js/Pages/Ventas/components/ViewModal.jsx
import React, { useState, useEffect } from 'react';
import Modal from '@/Components/ui/Modal';
import { Search } from 'lucide-react';

const ViewModal = ({ isOpen, onClose, venta }) => {
  const [ventaCompleta, setVentaCompleta] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    if (isOpen && venta) {
      fetchDetallesYFormasPago(venta);
    }
  }, [isOpen, venta]);

  const fetchDetallesYFormasPago = async (ventaBase) => {
    setLoadingDetails(true);
    try {
      // Llamamos en paralelo los endpoints:
      const [detallesRes, formasPagoRes] = await Promise.all([
        fetch(`/api/ventas/detalles/${ventaBase.COD_DOCUMENTO}/${ventaBase.SERI_VENTA}/${ventaBase.NUME_VENTA}`, {
          headers: { 'Accept': 'application/json' }
        }),
        fetch(`/api/ventas/formas-pago/${ventaBase.COD_DOCUMENTO}/${ventaBase.SERI_VENTA}/${ventaBase.NUME_VENTA}`, {
          headers: { 'Accept': 'application/json' }
        }),
      ]);
      const [detalles, formasPago] = await Promise.all([
        detallesRes.json(),
        formasPagoRes.json()
      ]);

      setVentaCompleta({
        ...ventaBase,
        detalles,
        formasPago,
      });
    } catch (error) {
      console.error('Error al cargar detalles:', error);
      alert('Error al cargar los detalles de la venta');
    } finally {
      setLoadingDetails(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        ventaCompleta
          ? `Detalle de Venta - ${ventaCompleta.COD_DOCUMENTO}-${ventaCompleta.SERI_VENTA}-${ventaCompleta.NUME_VENTA}`
          : 'Detalle de Venta'
      }
    >
      {loadingDetails ? (
        <div className="flex justify-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : ventaCompleta ? (
        <div className="space-y-6">
          {/* Información General */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-bold text-lg mb-4">Información General</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p><strong>Cliente:</strong> {ventaCompleta.RAZONSOCIALCLI}</p>
                <p><strong>Documento:</strong> {ventaCompleta.NUMERODOCUMENTOCLI}</p>
              </div>
              <div>
                <p><strong>Fecha:</strong> {
                  new Date(ventaCompleta.FEMI_VENTA).toLocaleDateString('es-ES', {
                    day: '2-digit', month: '2-digit', year: '2-digit'
                  })
                }</p>
              </div>
            </div>
          </div>

          {/* Detalles de la Venta */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Detalles de la Venta</h3>
              <p className="font-bold text-lg">
                Total: S/ {parseFloat(ventaCompleta.TOTAL_VENTA || 0).toFixed(2)}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="px-4 py-2 text-left">Artículo</th>
                    <th className="px-4 py-2 text-right">Cantidad</th>
                    <th className="px-4 py-2 text-right">P.Unit</th>
                    <th className="px-4 py-2 text-right">SubTotal</th>
                  </tr>
                </thead>
                <tbody>
                  {ventaCompleta.detalles?.map((detalle, index) => {
                    const qty = parseFloat(detalle.CANT_VENTASD) || 0;
                    const pu = parseFloat(detalle.PUNI_VENTASD) || 0;
                    const subtotal = qty * pu;
                    return (
                      <tr key={index} className="border-b">
                        <td className="px-4 py-2">
                          {detalle.nombrearticulo || detalle.NOMBREARTICULO || 'Sin nombre'}
                        </td>
                        <td className="px-4 py-2 text-right">
                          {qty.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-right">
                          S/ {pu.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-right">
                          S/ {subtotal.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Formas de Pago */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-bold text-lg mb-4">Formas de Pago</h3>
            <div className="space-y-2">
              {ventaCompleta.formasPago?.map((forma, index) => (
                <div key={index} className="grid grid-cols-2 gap-4 p-2 border-b">
                  <p><strong>Tipo:</strong> {forma.REFE_FORMAP}</p>
                  <p><strong>Monto:</strong> S/ {parseFloat(forma.TMONT_FORMAP || 0).toFixed(2)}</p>
                  {forma.NUM_FORMAP && (
                    <p><strong>Número:</strong> {forma.NUM_FORMAP}</p>
                  )}
                  {forma.CODTARJETA && (
                    <p><strong>Tarjeta:</strong> {forma.CODTARJETA}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <p className="text-center text-gray-500">No hay información disponible</p>
      )}
    </Modal>
  );
};

export default ViewModal;
