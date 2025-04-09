import React, { useState, useEffect } from 'react';
import Modal from '@/Components/ui/Modal';
import IconButton from '@/Components/ui/IconButton';
import { XCircle } from 'lucide-react';

export const CreateModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    sucursal_id: '',
    nombre: '',
    ubicacion: ''
  });
  const [sucursales, setSucursales] = useState([]);

  const loadSucursales = () => {
    fetch('/api/sucursales')
      .then(r => r.json())
      .then(data => setSucursales(data))
      .catch(err => console.error('Error al cargar sucursales:', err));
  };

  useEffect(() => {
    if (isOpen) {
      setFormData({ sucursal_id: '', nombre: '', ubicacion: '' });
      loadSucursales();
    }
  }, [isOpen]);

  const handleCrear = () => {
    if (!formData.sucursal_id) {
      alert('Por favor, seleccione una sucursal.');
      return;
    }
    onSubmit(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Crear Almacén">
      <div className="p-4 space-y-4">
        {/* Seleccionar sucursal */}
        <label className="block text-sm font-semibold mb-2">
          Sucursal *
          <select
            className="mt-1 block w-full border p-2 rounded focus:ring-2 focus:ring-blue-500"
            value={formData.sucursal_id}
            onChange={(e) => setFormData({ ...formData, sucursal_id: e.target.value })}
            required
          >
            <option value="">-- Seleccione una sucursal --</option>
            {sucursales.map((suc) => (
              <option key={suc.id} value={suc.id}>
                {suc.nombre} - {suc.direccion}
              </option>
            ))}
          </select>
        </label>

        {/* Nombre del almacén */}
        <label className="block text-sm font-semibold mb-2">
          Nombre *
          <input
            type="text"
            className="mt-1 block w-full border p-2 rounded focus:ring-2 focus:ring-blue-500"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            required
          />
        </label>

        {/* Ubicación */}
        <label className="block text-sm font-semibold mb-2">
          Ubicación *
          <input
            type="text"
            className="mt-1 block w-full border p-2 rounded focus:ring-2 focus:ring-blue-500"
            value={formData.ubicacion}
            onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
            required
          />
        </label>

        {/* Botones */}
        <div className="flex justify-end gap-3 mt-6">
          <IconButton
            icon={XCircle}
            label="Cancelar"
            variant="secondary"
            size="md"
            onClick={onClose}
          />
          <button
            onClick={handleCrear}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Guardar
          </button>
        </div>
      </div>
    </Modal>
  );
};