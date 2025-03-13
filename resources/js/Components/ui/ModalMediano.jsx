import React from 'react';
import ReactModal from 'react-modal';
import { X } from 'lucide-react';

export default function ModalMediano({
  isOpen,
  onClose,
  title,
  children
}) {
    const baseStyles = {
        content: {
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: '#fff',
          padding: '0',
          borderRadius: '8px',
          maxWidth: '70vw',  // Sigue ajustando el ancho
          width: '90%',
          maxHeight: '65vh', // Incrementa la altura máxima
          height: '90vh'     // Asegura que el modal tenga más altura
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          zIndex: 9999
        }
      };
      

  return (
    <ReactModal
      isOpen={isOpen}
      onRequestClose={onClose}
      style={baseStyles}
      ariaHideApp={false}
    >
      <div className="flex flex-col h-full max-h-[85vh]">
        {/* Encabezado */}
        <div className="p-4 border-b bg-white flex items-center justify-between">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        {/* Contenido con scroll */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </ReactModal>
  );
}
