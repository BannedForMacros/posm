// resources/js/Pages/Warehouse/components/EditModal.jsx
import React, { useState, useEffect } from 'react';
import Modal from '@/Components/ui/Modal';
import { X } from 'lucide-react';

export default function EditModal({ isOpen, onClose, documento }) {
  const [fecha, setFecha] = useState('');
  const [tipoMov, setTipoMov] = useState('');

  useEffect(() => {
    if (documento) {
      setFecha(documento.fecha || '');
      setTipoMov(documento.tipo_movimiento || '');
    }
  }, [documento]);

  if (!isOpen || !documento) return null;

  const handleUpdate = () => {
    // Lógica para editar (PUT /api/warehouse-documents/{id}) si la tuvieras
    console.log('Actualizar documento:', documento.id, { fecha, tipoMov });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Editar Documento #{documento.id}</h2>
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
          onClick={handleUpdate}
        >
          Actualizar
        </button>
      </div>
    </Modal>
  );
}
