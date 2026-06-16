import React from 'react';
import ReactModal from 'react-modal';
import { X } from 'lucide-react';

const ModalGrande = ({ isOpen, onClose, title, children }) => {
  const customStyles = {
    content: {
      top: '50%',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      transform: 'translate(-50%, -50%)',
      backgroundColor: 'white',
      padding: '0',
      borderRadius: '8px',
      // Responsive: ocupa el 95% del viewport pero nunca más de 1400px.
      width: '95vw',
      maxWidth: '1400px',
      maxHeight: '85vh',
    },
    overlay: {
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      zIndex: 1000
    }
  };

  return (
    <ReactModal
      isOpen={isOpen}
      onRequestClose={onClose}
      style={customStyles}
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

export default ModalGrande;