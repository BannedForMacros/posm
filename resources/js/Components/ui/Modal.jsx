import React from 'react';
import ReactModal from 'react-modal';
import { X } from 'lucide-react';

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'normal' // "normal" o "large"
}) => {
  // Definimos estilos base
  const baseStyles = {
    content: {
      top: '50%',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      transform: 'translate(-50%, -50%)',
      backgroundColor: 'white',
      padding: '0',
      borderRadius: '8px',
      maxWidth: '600px', // ancho base para "normal"
      width: '90%',
      maxHeight: '85vh',
    },
    overlay: {
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      zIndex: 1000
    }
  };

  // Si queremos un modal más grande ("large")
  if (size === 'large') {
    baseStyles.content.maxWidth = '80vw'; // más ancho
    baseStyles.content.width = '90%';     // opcionalmente más ancho
  }

  return (
    <ReactModal
      isOpen={isOpen}
      onRequestClose={onClose}
      style={baseStyles}
      contentLabel={title}
      ariaHideApp={false}
    >
      <div className="flex flex-col h-full max-h-[85vh]">
        {/* Header fijo */}
        <div className="p-4 border-b bg-white sticky top-0 z-10 flex items-center justify-between">
          <h2 className="text-xl font-bold">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Contenido con scroll */}
        <div className="flex-1 overflow-y-auto p-4">
          {children}
        </div>
      </div>
    </ReactModal>
  );
};

export default Modal;
