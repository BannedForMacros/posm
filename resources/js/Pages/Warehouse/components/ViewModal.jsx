import React from 'react';
import Modal from '@/Components/ui/Modal'; // Ajusta la ruta a tu componente Modal
import { X } from 'lucide-react';

export default function ViewModal({ isOpen, onClose, documento }) {
  if (!isOpen || !documento) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-4 max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Documento #{documento.id}</h2>
          <button onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <p><strong>Fecha:</strong> {documento.fecha}</p>
        <p><strong>Tipo Movimiento:</strong> {documento.tipo_movimiento}</p>
        <p><strong>Operación:</strong> {documento.operacion?.descripcion}</p>
        <p><strong>Usuario:</strong> {documento.user?.name}</p>

        {/* Si quieres ver los detalles (productos, etc.) */}
        {documento.detalles && documento.detalles.length > 0 && (
          <div className="mt-4">
            <h3 className="font-bold mb-2">Detalles</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-2 text-left">Cód. Artículo</th>
                  <th className="p-2 text-left">Cantidad</th>
                  <th className="p-2 text-left">Precio Unit.</th>
                </tr>
              </thead>
              <tbody>
                {documento.detalles.map(det => (
                  <tr key={det.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">{det.cod_articulo}</td>
                    <td className="p-2">{det.cantidad}</td>
                    <td className="p-2">{det.precio_unitario}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Modal>
  );
}
