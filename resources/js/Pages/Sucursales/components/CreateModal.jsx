// src/Pages/Sucursales/components/CreateModal.jsx
import React, { useState } from 'react';
import Modal from '@/Components/ui/Modal';
<<<<<<< HEAD
import { useSucursales } from '../hooks/useSucursales';
=======
>>>>>>> 0534e466fbc86a6fcd308a81f78de42db62daf18

const CreateModal = ({ isOpen, onClose, onCreated, crearSucursal }) => {
  const [form, setForm] = useState({
    nombre: '',
    direccion: ''
  });

  const handleCrear = async () => {
    await crearSucursal(form);
<<<<<<< HEAD
    // Limpiar el formulario y cerrar el modal
=======
    // Invoca el callback para notificar al padre
    if (onCreated) onCreated();
    // Limpia el formulario y cierra el modal
>>>>>>> 0534e466fbc86a6fcd308a81f78de42db62daf18
    setForm({ nombre: '', direccion: '' });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setForm({ nombre: '', direccion: '' });
        onClose();
      }}
      title="Crear Sucursal"
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
            onClick={() => {
              setForm({ nombre: '', direccion: '' });
              onClose();
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            onClick={handleCrear}
          >
            Guardar
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default CreateModal;
