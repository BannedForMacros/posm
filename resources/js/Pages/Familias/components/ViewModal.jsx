import React from 'react';
import Modal from '@/Components/ui/Modal';

export const ViewModal = ({
  isOpen,
  onClose,
  familia
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalle de Familia"
    >
      {familia && (
        <div className="space-y-4">
          <div className="block">
            <span className="font-bold text-gray-700">Código:</span>
            <p className="mt-1 p-2 w-full bg-gray-50 border rounded">
              {familia.codfamilia}
            </p>
          </div>
          
          <div className="block">
            <span className="font-bold text-gray-700">Familia:</span>
            <p className="mt-1 p-2 w-full bg-gray-50 border rounded">
              {familia.familia}
            </p>
          </div>
          
          <div className="block">
            <span className="font-bold text-gray-700">Subfamilia:</span>
            <p className="mt-1 p-2 w-full bg-gray-50 border rounded">
              {familia.subfamilia || '-'}
            </p>
          </div>

          <button
            className="mt-4 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>
      )}
    </Modal>
  );
};

export default ViewModal;