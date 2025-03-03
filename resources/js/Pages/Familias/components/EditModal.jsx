import React from 'react';
import Modal from '@/Components/ui/Modal';

export const EditModal = ({
  isOpen,
  onClose,
  familia,
  setFamilia,
  onSubmit,
  soloVer
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={soloVer ? 'Detalle de Familia' : 'Editar Familia'}
    >
      {familia && (
        <div className="space-y-4">
          <label className="block">
            <span>Código (no editable):</span>
            <input
              type="text"
              className="mt-1 block w-full border p-2 bg-gray-100"
              value={familia.codfamilia}
              readOnly
            />
          </label>
          <label className="block">
            <span>Familia:</span>
            <input
              type="text"
              className="mt-1 block w-full border p-2"
              value={familia.familia}
              onChange={(e) =>
                setFamilia({ ...familia, familia: e.target.value })
              }
              readOnly={soloVer}
            />
          </label>
          <label className="block">
            <span>Subfamilia:</span>
            <input
              type="text"
              className="mt-1 block w-full border p-2"
              value={familia.subfamilia || ''}
              onChange={(e) =>
                setFamilia({ ...familia, subfamilia: e.target.value })
              }
              readOnly={soloVer}
            />
          </label>

          {!soloVer && (
            <button
              className="bg-green-500 text-white px-4 py-2 rounded"
              onClick={onSubmit}
            >
              Actualizar
            </button>
          )}
        </div>
      )}
    </Modal>
  );
};