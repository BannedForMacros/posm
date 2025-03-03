import React, { useState, useEffect } from 'react';
import Modal from '@/Components/ui/Modal';
import Swal from 'sweetalert2';

const EditModal = ({ isOpen, onClose, proveedor, onEdited }) => {
  const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

  const [form, setForm] = useState({
    razon_social: '',
    direccion: '',
    telefono: '',
    email: ''
  });

  useEffect(() => {
    if (proveedor && isOpen) {
      setForm({
        razon_social: proveedor.razon_social || '',
        direccion: proveedor.direccion || '',
        telefono: proveedor.telefono || '',
        email: proveedor.email || ''
      });
    }
  }, [proveedor, isOpen]);

  const handleActualizar = async () => {
    if (!proveedor) return;

    try {
      const response = await fetch(`/api/proveedores/${proveedor.id}`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': token
        },
        body: JSON.stringify(form)
      });

      if (!response.ok) {
        const msg = await response.json();
        throw new Error(msg.message || 'Error al actualizar el proveedor');
      }

      const data = await response.json();

      await Swal.fire({
        icon: 'success',
        title: 'Proveedor Actualizado',
        text: data.message
      });

      onClose(); // Primero cerramos el modal
      if (onEdited) {
        await onEdited(); // Luego actualizamos la tabla
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message
      });
    }
  };

  if (!proveedor) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Editar Proveedor - ID: ${proveedor.id}`}>
      <div className="p-4 space-y-6 max-h-[80vh] overflow-y-auto">
        <label className="block">
          <span className="text-sm font-semibold">Razón Social:</span>
          <input
            type="text"
            className="mt-1 block w-full border p-2 rounded"
            value={form.razon_social}
            onChange={e => setForm({ ...form, razon_social: e.target.value })}
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

        <label className="block">
          <span className="text-sm font-semibold">Teléfono:</span>
          <input
            type="text"
            className="mt-1 block w-full border p-2 rounded"
            value={form.telefono}
            onChange={e => setForm({ ...form, telefono: e.target.value })}
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold">Email:</span>
          <input
            type="email"
            className="mt-1 block w-full border p-2 rounded"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
          />
        </label>

        <div className="flex justify-end space-x-3 pt-4 border-t mt-4">
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