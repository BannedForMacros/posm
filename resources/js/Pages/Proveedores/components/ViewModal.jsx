import React from 'react';
import Modal from '@/Components/ui/Modal';

const ViewModal = ({ isOpen, onClose, proveedor }) => {
  if (!proveedor) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detalle de Proveedor">
      <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
        <label className="block">
          <span className="text-sm font-semibold">ID:</span>
          <input
            type="text"
            className="mt-1 block w-full border p-2 bg-gray-100"
            value={proveedor.id}
            readOnly
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold">RUC:</span>
          <input
            type="text"
            className="mt-1 block w-full border p-2 bg-gray-100"
            value={proveedor.ruc}
            readOnly
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold">Razón Social:</span>
          <input
            type="text"
            className="mt-1 block w-full border p-2 bg-gray-100"
            value={proveedor.razon_social}
            readOnly
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold">Dirección:</span>
          <input
            type="text"
            className="mt-1 block w-full border p-2 bg-gray-100"
            value={proveedor.direccion}
            readOnly
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold">Teléfono:</span>
          <input
            type="text"
            className="mt-1 block w-full border p-2 bg-gray-100"
            value={proveedor.telefono}
            readOnly
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold">Email:</span>
          <input
            type="text"
            className="mt-1 block w-full border p-2 bg-gray-100"
            value={proveedor.email}
            readOnly
          />
        </label>
      </div>
      <div className="flex justify-end border-t bg-gray-50 p-4">
        <button
          type="button"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
          onClick={onClose}
        >
          Cerrar
        </button>
      </div>
    </Modal>
  );
};

export default ViewModal;
