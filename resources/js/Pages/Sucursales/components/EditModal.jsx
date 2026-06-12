// src/components/modals/EditModal.jsx
import React, { useState, useEffect } from 'react';
import Modal from '@/Components/ui/Modal';

// editarSucursal llega por props desde el padre: si el modal creara su propia
// instancia de useSucursales, refrescaría una copia del estado y la tabla
// del padre quedaría desactualizada.
const EditModal = ({ isOpen, onClose, sucursal, editarSucursal, onEdited }) => {
  const [form, setForm] = useState({
    nombre: '',
    direccion: ''
  });

  useEffect(() => {
    if (sucursal && isOpen) {
      setForm({
        nombre: sucursal.nombre || '',
        direccion: sucursal.direccion || ''
      });
    }
  }, [sucursal, isOpen]);

  const handleActualizar = async () => {
    if (!sucursal) return;

    await editarSucursal(sucursal.id, form);
    if (onEdited) {
      await onEdited();
    }
    onClose();
  };

  if (!sucursal) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Editar Sucursal - ${sucursal.nombre}`}
    >
      <div className="space-y-4 p-4">
        <label className="block">
          <span className="text-sm font-semibold">Nombre de la Sucursal:</span>
          <input
            type="text"
            className="mt-1 block w-full border p-2 rounded"
            value={form.nombre}
            onChange={e => setForm({ ...form, nombre: e.target.value })}
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold">Dirección:</span>
          <input
            type="text"
            className="mt-1 block w-full border p-2 rounded"
            value={form.direccion}
            onChange={e => setForm({ ...form, direccion: e.target.value })}
          />
        </label>

        <div className="flex justify-end space-x-3 mt-4">
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
            onClick={handleActualizar}
          >
            Actualizar
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default EditModal;
