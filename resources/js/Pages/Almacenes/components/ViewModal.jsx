import React from 'react';
import Modal from '@/Components/ui/Modal';

const ViewModal = ({ isOpen, onClose, almacen }) => {
  if (!almacen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detalle de Almacén">
      <div className="p-4 space-y-4">
        <div>
          <label className="block text-sm font-semibold">Nombre</label>
          <div className="border p-2 rounded">{almacen.nombre}</div>
        </div>
        <div>
          <label className="block text-sm font-semibold">Ubicación</label>
          <div className="border p-2 rounded">{almacen.ubicacion}</div>
        </div>
        <div>
          <label className="block text-sm font-semibold">Estado</label>
          <div className="border p-2 rounded">
            {almacen.estado === 1 ? 'Activo' : 'Inactivo'}
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <button
            className="bg-gray-300 px-4 py-2 rounded"
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
