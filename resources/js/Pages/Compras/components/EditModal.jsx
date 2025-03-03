// EditModal.jsx
import React, { useState, useEffect } from 'react';
import Modal from '@/Components/ui/Modal';

const EditModal = ({ isOpen, onClose, compra, editarCompraFn }) => {
  const [compraLocal, setCompraLocal] = useState(null);

  useEffect(() => {
    setCompraLocal(compra ? { ...compra } : null);
  }, [compra]);

  if (!compraLocal) {
    return null;
  }

  const handleUpdate = () => {
    editarCompraFn(compraLocal.id, {
      fecha: compraLocal.fecha,
      valor_compra: compraLocal.valor_compra,
      // ... si quieres reinsertar detalles, etc.
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Compra">
      <div className="space-y-4">
        <label className="block">
          <span className="font-semibold">ID:</span>
          <input
            type="text"
            className="mt-1 block w-full border p-2 bg-gray-100"
            value={compraLocal.id}
            readOnly
          />
        </label>
        <label className="block">
          <span className="font-semibold">Fecha:</span>
          <input
            type="date"
            className="mt-1 block w-full border p-2"
            value={compraLocal.fecha?.slice(0, 10)}
            onChange={(e) => setCompraLocal({ ...compraLocal, fecha: e.target.value })}
          />
        </label>
        <label className="block">
          <span className="font-semibold">Valor Compra:</span>
          <input
            type="number"
            step="0.01"
            className="mt-1 block w-full border p-2"
            value={compraLocal.valor_compra}
            onChange={(e) => setCompraLocal({ ...compraLocal, valor_compra: e.target.value })}
          />
        </label>
        {/* ... Detalles, si deseas ... */}

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 transition"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
            onClick={handleUpdate}
          >
            Actualizar
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default EditModal;
