import React, { useState } from 'react';
import Modal from '@/Components/ui/Modal';
import { Search } from 'lucide-react';
import Swal from 'sweetalert2';

const CreateModal = ({ isOpen, onClose, onCreated }) => {
  const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

  const [form, setForm] = useState({
    ruc: '',
    razon_social: '',
    direccion: '',
    telefono: '',
    email: ''
  });

  const resetForm = () => {
    setForm({
      ruc: '',
      razon_social: '',
      direccion: '',
      telefono: '',
      email: ''
    });
  };

  const handleSearchRUC = () => {
    Swal.fire({
      icon: 'info',
      title: 'Buscar RUC',
      text: 'Aquí integrarás la búsqueda en SUNAT'
    });
  };

  const handleCrear = async () => {
    try {
      const response = await fetch('/api/proveedores', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': token
        },
        body: JSON.stringify(form)
      });

      if (!response.ok) {
        const msg = await response.json();
        throw new Error(msg.message || 'Error al crear el proveedor');
      }

      const data = await response.json();

      await Swal.fire({
        icon: 'success',
        title: 'Proveedor Creado',
        text: data.message
      });

      resetForm();
      onClose();  // Primero cerramos el modal
      if (onCreated) {
        await onCreated();  // Luego actualizamos la tabla
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Crear Proveedor">
      <div className="p-4 space-y-6 max-h-[80vh] overflow-y-auto">
        
        {/* RUC + botón de búsqueda */}
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-8">
            <label className="block">
              <span className="text-sm font-semibold">RUC:</span>
              <input
                type="text"
                className="mt-1 block w-full border p-2 rounded"
                placeholder="Ingrese RUC"
                value={form.ruc}
                onChange={(e) => setForm({ ...form, ruc: e.target.value })}
              />
            </label>
          </div>
          <div className="col-span-4 flex items-end">
            <button
              type="button"
              onClick={handleSearchRUC}
              className="inline-flex items-center gap-1 rounded bg-gray-500 px-3 py-2 text-white transition hover:bg-gray-600"
            >
              <Search size={16} />
              Buscar
            </button>
          </div>
        </div>

        {/* Razón Social */}
        <div>
          <label className="block">
            <span className="text-sm font-semibold">Razón Social:</span>
            <input
              type="text"
              className="mt-1 block w-full border p-2 rounded"
              placeholder="Ingrese la razón social"
              value={form.razon_social}
              onChange={(e) => setForm({ ...form, razon_social: e.target.value })}
            />
          </label>
        </div>

        {/* Dirección */}
        <div>
          <label className="block">
            <span className="text-sm font-semibold">Dirección:</span>
            <input
              type="text"
              className="mt-1 block w-full border p-2 rounded"
              placeholder="Ingrese la dirección"
              value={form.direccion}
              onChange={(e) => setForm({ ...form, direccion: e.target.value })}
            />
          </label>
        </div>

        {/* Teléfono y Email en la misma línea */}
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm font-semibold">Teléfono:</span>
            <input
              type="text"
              className="mt-1 block w-full border p-2 rounded"
              placeholder="Ingrese teléfono"
              value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold">Email:</span>
            <input
              type="email"
              className="mt-1 block w-full border p-2 rounded"
              placeholder="Ingrese email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </label>
        </div>

        {/* Botones de acción */}
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