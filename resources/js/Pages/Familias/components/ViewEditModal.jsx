// src/Pages/Familias/components/ViewEditModal.jsx
import React, { useState, useEffect } from 'react';
import Modal from '@/Components/ui/Modal';
import '../styles/Switch.css';

const ViewEditModal = ({ isOpen, onClose, familia, setFamilia, onSubmit }) => {
  // isEditable controla si el modal está en modo edición o sólo vista.
  const [isEditable, setIsEditable] = useState(false);

  // Al cerrar el modal se reinicia el modo a "ver" (view).
  useEffect(() => {
    if (!isOpen) {
      setIsEditable(false);
    }
  }, [isOpen]);

  // La cabecera personalizada muestra "Ver" (a la izquierda) y "Editar" (a la derecha)
  // con el switch en el centro para cambiar el modo.
  const headerContent = (
    <div className="flex items-center justify-between w-full">
      <span className={`text-sm ${!isEditable ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>
        Ver
      </span>
      <label className="switch">
        <input
          type="checkbox"
          checked={isEditable}
          onChange={(e) => setIsEditable(e.target.checked)}
        />
        <span className="slider"></span>
      </label>
      <span className={`text-sm ${isEditable ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>
        Editar
      </span>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={headerContent}>
      {familia && (
        <div className="space-y-4">
          {/* Campo Código: siempre de solo lectura */}
          <label className="block">
            <span className="font-bold text-gray-700">Código (no editable):</span>
            <input
              type="text"
              className="mt-1 block w-full border p-2 bg-gray-100"
              value={familia.codfamilia}
              readOnly
            />
          </label>

          {/* Campo Familia */}
          <label className="block">
            <span className="font-bold text-gray-700">Familia:</span>
            {isEditable ? (
              <input
                type="text"
                className="mt-1 block w-full border p-2"
                value={familia.familia}
                onChange={(e) =>
                  setFamilia({ ...familia, familia: e.target.value })
                }
              />
            ) : (
              <p className="mt-1 p-2 w-full bg-gray-50 border rounded">
                {familia.familia}
              </p>
            )}
          </label>

          {/* Campo Subfamilia */}
          <label className="block">
            <span className="font-bold text-gray-700">Subfamilia:</span>
            {isEditable ? (
              <input
                type="text"
                className="mt-1 block w-full border p-2"
                value={familia.subfamilia || ''}
                onChange={(e) =>
                  setFamilia({ ...familia, subfamilia: e.target.value })
                }
              />
            ) : (
              <p className="mt-1 p-2 w-full bg-gray-50 border rounded">
                {familia.subfamilia || '-'}
              </p>
            )}
          </label>

          {/* Botón de acción: "Actualizar" en modo edición y "Cerrar" en modo vista */}
          {isEditable ? (
            <button
              className="mt-4 bg-green-500 text-white px-4 py-2 rounded"
              onClick={onSubmit}
            >
              Actualizar
            </button>
          ) : (
            <button
              className="mt-4 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              onClick={onClose}
            >
              Cerrar
            </button>
          )}
        </div>
      )}
    </Modal>
  );
};

export default ViewEditModal;
