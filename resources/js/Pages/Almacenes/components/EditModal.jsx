import React, { useState, useEffect } from 'react';
import Modal from '@/Components/ui/Modal';
import IconButton from '@/Components/ui/IconButton';
import { XCircle } from 'lucide-react';

export const EditModal = ({ isOpen, onClose, almacen, onSubmit }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    ubicacion: ''
  });

  useEffect(() => {
    if (isOpen && almacen) {
      setFormData({
        nombre: almacen.nombre || '',
        ubicacion: almacen.ubicacion || ''
      });
    }
  }, [isOpen, almacen]);

  const handleActualizar = () => {
    if (!almacen || !formData.nombre.trim() || !formData.ubicacion.trim()) {
      alert('Por favor, complete todos los campos obligatorios');
      return;
    }
    onSubmit(almacen.id, formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Almacén">
      <div className="p-4 space-y-4">
        <label className="block text-sm font-semibold mb-2">
          Nombre
          <input
            type="text"
            className="mt-1 block w-full border p-2 rounded focus:ring-2 focus:ring-orange-500"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            required
          />
        </label>

        <label className="block text-sm font-semibold mb-2">
          Ubicación
          <input
            type="text"
            className="mt-1 block w-full border p-2 rounded focus:ring-2 focus:ring-orange-500"
            value={formData.ubicacion}
            onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
            required
          />
        </label>

        <div className="flex justify-end gap-3 mt-6">
          <IconButton
            icon={XCircle}
            label="Cancelar"
            variant="secondary"
            size="md"
            onClick={onClose}
          />
          <button
            onClick={handleActualizar}
            className="px-5 py-2 bg-orange-600 text-white rounded-md 
                     hover:bg-orange-700 transition-colors font-medium
                     focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
          >
            Guardar Cambios
          </button>
        </div>
      </div>
    </Modal>
  );
};