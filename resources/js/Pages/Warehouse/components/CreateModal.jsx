// resources/js/Pages/Warehouse/components/CreateModal.jsx
import React, { useState } from 'react';
import Modal from '@/Components/ui/Modal'; // Ajusta la ruta a tu componente Modal
import { X } from 'lucide-react';

export default function CreateModal({ isOpen, onClose }) {
  const [fecha, setFecha] = useState('');
  const [tipoMov, setTipoMov] = useState('');

  if (!isOpen) return null;

  const handleCreate = () => {
    // Lógica para crear un documento (POST /api/warehouse-documents) si la tuvieras
    console.log('Crear documento:', { fecha, tipoMov });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Crear Documento</h2>
          <button onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4">
          <label className="block mb-1">Fecha</label>
          <input
            type="date"
            className="border p-1 w-full"
            value={fecha}
            onChange={e => setFecha(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1">Tipo Movimiento</label>
          <input
            type="text"
            className="border p-1 w-full"
            value={tipoMov}
            onChange={e => setTipoMov(e.target.value)}
          />
        </div>

        <button
          className="bg-blue-500 text-white px-3 py-2 rounded"
          onClick={handleCreate}
        >
          Guardar
        </button>
      </div>
    </Modal>
  );
}
