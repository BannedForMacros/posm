import React from 'react';
import Modal from '@/Components/ui/Modal';

const ViewModal = ({ isOpen, onClose, sucursal }) => {
  if (!sucursal) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Detalle de Sucursal`}
    >
      <div className="p-4 space-y-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-lg mb-2">Información de la Sucursal</h3>
          <div className="space-y-2">
            <div>
              <label className="text-sm font-medium text-gray-600">Nombre:</label>
              <p className="mt-1 p-2 bg-white border rounded">{sucursal.nombre || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Dirección:</label>
              <p className="mt-1 p-2 bg-white border rounded">{sucursal.direccion || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Estado:</label>
              <p className="mt-1 p-2 bg-white border rounded">
                {sucursal.estado === 1 ? 'Activo' : 'Inactivo'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded"
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ViewModal;
