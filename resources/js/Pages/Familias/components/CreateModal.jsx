import React from 'react';
import Modal from '@/Components/ui/Modal';

export const CreateModal = ({
  isOpen,
  onClose,
  nuevaFamilia,
  setNuevaFamilia,
  onSubmit
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Crear Nueva Familia"
    >
      <div className="space-y-4">
        <label className="block">
          <span>Código:</span>
          <input
            type="text"
            className="mt-1 block w-full border p-2"
            value={nuevaFamilia.codfamilia}
            onChange={(e) =>
              setNuevaFamilia({ ...nuevaFamilia, codfamilia: e.target.value })
            }
          />
        </label>
        <label className="block">
          <span>Familia:</span>
          <input
            type="text"
            className="mt-1 block w-full border p-2"
            value={nuevaFamilia.familia}
            onChange={(e) =>
              setNuevaFamilia({ ...nuevaFamilia, familia: e.target.value })
            }
          />
        </label>
        <label className="block">
          <span>Subfamilia:</span>
          <input
            type="text"
            className="mt-1 block w-full border p-2"
            value={nuevaFamilia.subfamilia}
            onChange={(e) =>
              setNuevaFamilia({ ...nuevaFamilia, subfamilia: e.target.value })
            }
          />
        </label>
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded"
          onClick={onSubmit}
        >
          Guardar
        </button>
      </div>
    </Modal>
  );
};