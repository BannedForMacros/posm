import React, { useState, useEffect } from 'react';
import Modal from '@/Components/ui/Modal'; // Ajusta la ruta de tu componente Modal
import IconButton from '@/Components/ui/IconButton'; // Para el botón "Guardar"
import { XCircle } from 'lucide-react';

export const CreateModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    sucursal_id: '',
    nombre: '',
    ubicacion: ''
  });
  const [sucursales, setSucursales] = useState([]);

  // Cargar sucursales del usuario autenticado
  const loadSucursales = () => {
    fetch('/api/sucursales') // Ajusta si tu ruta es distinta
      .then(r => r.json())
      .then(data => {
        setSucursales(data);
      })
      .catch(err => console.error('Error al cargar sucursales:', err));
  };

  useEffect(() => {
    if (isOpen) {
      // Cada vez que abra el modal, limpio el form y cargo las sucursales
      setFormData({ sucursal_id: '', nombre: '', ubicacion: '' });
      loadSucursales();
    }
  }, [isOpen]);

  const handleCrear = () => {
    // Validar que haya elegido sucursal
    if (!formData.sucursal_id) {
      alert('Por favor, seleccione una sucursal.');
      return;
    }
    // Llamar a la función "onSubmit" que viene de props (hook useAlmacenes)
    onSubmit(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Crear Almacén">
      <div className="p-4 space-y-4">
        {/* Seleccionar sucursal */}
        <label className="block text-sm font-semibold">
          Sucursal
          <select
            className="mt-1 block w-full border p-2 rounded"
            value={formData.sucursal_id}
            onChange={(e) => setFormData({ ...formData, sucursal_id: e.target.value })}
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
        <label className="block text-sm font-semibold">
          Nombre
          <input
            type="text"
            className="mt-1 block w-full border p-2 rounded"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
          />
        </label>

        {/* Ubicación */}
        <label className="block text-sm font-semibold">
          Ubicación
          <input
            type="text"
            className="mt-1 block w-full border p-2 rounded"
            value={formData.ubicacion}
            onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
          />
        </label>

        {/* Botones */}
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
            onClick={handleCrear}
          />
        </div>
      </div>
    </Modal>
  );
};
