import React from 'react';
import Modal from '@/Components/ui/Modal'; // o ModalGrande si deseas ancho
import dayjs from 'dayjs';               // opcional para formatear fechas

export default function ViewDocModal({ isOpen, onClose, docData }) {
  if (!isOpen) return null;

  // Seguridad por si docData no está aún cargado
  if (!docData) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Detalle del Documento">
        <div className="p-4">Cargando información...</div>
      </Modal>
    );
  }

  // Extraemos campos
  const {
    fecha,
    tipo_movimiento,
    user,
    operacion,
    facturacion_id,
    venta_id,
    almacen,
    detalles
  } = docData;

  // Formato de fecha
  const fechaFormateada = fecha 
    ? dayjs(fecha).format('YYYY-MM-DD HH:mm:ss') 
    : 'Sin fecha';

  // Determinar si es compra o venta
  let docAsociado = 'N/A';
  if (facturacion_id) {
    docAsociado = `Compra (Facturación #${facturacion_id})`;
  } else if (venta_id) {
    docAsociado = `Venta (#${venta_id})`;
  }

  // Nombre de la operación
  const operacionDescripcion = operacion?.descripcion || 'Sin operación';

  // Nombre del usuario
  const userName = user?.name || 'Desconocido';

  // Nombre de almacén
  const almacenName = almacen?.nombre || 'Sin Almacén';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detalle del Documento de Almacén">
      <div className="p-4 space-y-4">
        
        {/* Info principal */}
        <div className="bg-gray-50 p-4 rounded">
          <h3 className="font-semibold text-lg mb-2">Información del Documento</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <label className="font-medium text-gray-600">Fecha:</label>
              <p>{fechaFormateada}</p>
            </div>
            <div>
              <label className="font-medium text-gray-600">Tipo Movimiento:</label>
              {tipo_movimiento === 'INGRESO' ? (
                <span className="text-green-600 font-bold">{tipo_movimiento}</span>
              ) : tipo_movimiento === 'SALIDA' ? (
                <span className="text-red-600 font-bold">{tipo_movimiento}</span>
              ) : (
                <span>{tipo_movimiento}</span>
              )}
            </div>

            <div>
              <label className="font-medium text-gray-600">Operación:</label>
              <p>{operacionDescripcion}</p>
            </div>
            <div>
              <label className="font-medium text-gray-600">Usuario:</label>
              <p>{userName}</p>
            </div>

            <div>
              <label className="font-medium text-gray-600">Documento Asociado:</label>
              <p>{docAsociado}</p>
            </div>
            <div>
              <label className="font-medium text-gray-600">Almacén:</label>
              <p>{almacenName}</p>
            </div>
          </div>
        </div>

        {/* Detalles */}
        <div className="bg-gray-50 p-4 rounded">
          <h3 className="font-semibold text-lg mb-2">Detalles</h3>
          {(!detalles || detalles.length === 0) ? (
            <p className="text-gray-500">No hay detalles.</p>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-gray-200">
                <tr>
                  <th className="px-3 py-2 text-left">Cód. Artículo</th>
                  <th className="px-3 py-2 text-left">Nombre</th>
                  <th className="px-3 py-2 text-right">Cantidad</th>
                  <th className="px-3 py-2 text-right">Precio Unit.</th>
                </tr>
              </thead>
              <tbody>
                {detalles.map((item, idx) => {
                  const nombreArt = item.articulo?.nombrearticulo || `Art #${item.cod_articulo}`;
                  return (
                    <tr key={idx} className="border-b">
                      <td className="px-3 py-2">{item.cod_articulo}</td>
                      <td className="px-3 py-2">{nombreArt}</td>
                      <td className="px-3 py-2 text-right">{parseFloat(item.cantidad).toFixed(2)}</td>
                      <td className="px-3 py-2 text-right">
                        S/ {parseFloat(item.precio_unitario).toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Botón Cerrar */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-200 hover:bg-gray-300 text-black px-4 py-2 rounded"
          >
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
}
