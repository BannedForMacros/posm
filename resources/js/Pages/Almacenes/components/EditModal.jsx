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
    if (!almacen) return;
    onSubmit(almacen.id, formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Almacén">
      <div className="p-4 space-y-4">
        <label className="block text-sm font-semibold">
          Nombre
          <input
            type="text"
            className="mt-1 block w-full border p-2 rounded"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
          />
        </label>

        <label className="block text-sm font-semibold">
          Ubicación
          <input
            type="text"
            className="mt-1 block w-full border p-2 rounded"
            value={formData.ubicacion}
            onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
          />
        </label>

        <div className="flex justify-end space-x-2 mt-4">
          <IconButton
            icon={XCircle}
            label="Cancelar"
            variant="secondary"
            size="md"
            onClick={onClose}
          />
          <IconButton
            label="Guardar"
            variant="primary"
            size="md"
            onClick={handleActualizar}
          />
        </div>
      </div>
    </Modal>
  );
};
