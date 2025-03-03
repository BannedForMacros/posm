import React, { useState } from 'react';
import Modal from '@/Components/ui/Modal';

const CreateArticuloModal = ({ isOpen, onClose, onCreated }) => {
  const [articulo, setArticulo] = useState({
    codarticulo: '',
    nombrearticulo: '',
    // etc...
  });
  const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

  const handleCrearArticulo = () => {
    fetch('/api/articulos-manage', {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(articulo),
    })
      .then(async (r) => {
        if (!r.ok) {
          const msg = await r.json();
          throw new Error(msg.message || 'Error al crear artículo');
        }
        return r.json();
      })
      .then(() => {
        alert('Artículo creado con éxito');
        if (onCreated) onCreated();
        onClose();
      })
      .catch((err) => alert(err));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Crear Artículo">
      <div className="space-y-4">
        <label className="block">
          <span className="text-sm font-semibold">Código Artículo:</span>
          <input
            type="number"
            className="mt-1 block w-full border p-2"
            value={articulo.codarticulo}
            onChange={(e) => setArticulo({ ...articulo, codarticulo: e.target.value })}
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold">Nombre Artículo:</span>
          <input
            type="text"
            className="mt-1 block w-full border p-2"
            value={articulo.nombrearticulo}
            onChange={(e) => setArticulo({ ...articulo, nombrearticulo: e.target.value })}
          />
        </label>
        {/* ... otros campos ... */}

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 transition"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
            onClick={handleCrearArticulo}
          >
            Guardar
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default CreateArticuloModal;
