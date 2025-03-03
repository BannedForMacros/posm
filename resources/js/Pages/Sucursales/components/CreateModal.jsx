// src/components/modals/CreateModal.jsx
import React, { useState } from 'react';
import Modal from '@/Components/ui/Modal'; // Ajusta la ruta según tu proyecto
import { useSucursales } from '../hooks/useSucursales';

const CreateModal = ({ isOpen, onClose }) => {
  const { crearSucursal } = useSucursales();
  const [form, setForm] = useState({
    nombre: '',
    direccion: ''
  });

  const handleCrear = () => {
    // Obtenemos el token CSRF del meta tag
    const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

    crearSucursal(form, token);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
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
            onClick={onClose}
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
