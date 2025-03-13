import React, { useState, useEffect } from 'react';
import Modal from '@/Components/ui/Modal';

const SearchArticuloModal = ({ isOpen, onClose, onSelect }) => {
  const [filtro, setFiltro] = useState('');
  const [articulos, setArticulos] = useState([]);

  useEffect(() => {
    if (isOpen) {
      // Cargar lista de artículos
      fetch('/api/articulos-manage')
        .then(r => r.json())
        .then(data => setArticulos(data))
        .catch(err => console.error(err));
    }
  }, [isOpen]);

  const filtered = articulos.filter(a =>
    a.codarticulo.toString().includes(filtro) ||
    (a.nombrecorto || '').toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Buscar Artículo">
      <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
        <input
          type="text"
          placeholder="Buscar por codarticulo o nombre..."
          className="w-full border p-2 rounded"
          value={filtro}
          onChange={e => setFiltro(e.target.value)}
        />
        <table className="w-full border">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 py-1">Cod Art</th>
              <th className="px-2 py-1">Nombre</th>
              <th className="px-2 py-1">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(art => (
              <tr key={art.codarticulo} className="border-b">
                <td className="px-2 py-1">{art.codarticulo}</td>
                <td className="px-2 py-1">{art.nombrearticulo || art.nombrecorto}</td>
                <td className="px-2 py-1">
                  <button
                    className="bg-blue-500 text-white px-2 py-1 rounded"
                    onClick={() => onSelect(art)}
                  >
                    Seleccionar
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="3" className="text-center py-2 text-gray-400">
                  Sin resultados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Modal>
  );
};

export default SearchArticuloModal;
