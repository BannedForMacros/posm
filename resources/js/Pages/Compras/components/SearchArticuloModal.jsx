import React, { useState, useEffect, useCallback } from 'react';
import Modal from '@/Components/ui/Modal';
import { Plus } from 'lucide-react';
import CreateArticuloModal from './CreateArticuloModal';

const SearchArticuloModal = ({ isOpen, onClose, onSelect }) => {
  const [filtro, setFiltro] = useState('');
  const [articulos, setArticulos] = useState([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const cargarArticulos = useCallback(async () => {
    try {
      const r = await fetch('/api/articulos-manage');
      const data = await r.json();
      setArticulos(Array.isArray(data) ? data : []);
      return data;
    } catch (err) {
      console.error(err);
      return [];
    }
  }, []);

  useEffect(() => {
    if (isOpen) cargarArticulos();
  }, [isOpen, cargarArticulos]);

  const filtered = articulos.filter(a =>
    a.codarticulo.toString().includes(filtro) ||
    (a.nombrearticulo || '').toLowerCase().includes(filtro.toLowerCase()) ||
    (a.nombrecorto || '').toLowerCase().includes(filtro.toLowerCase())
  );

  // Al crear un producto nuevo: refrescar la lista y seleccionarlo de una vez
  const handleProductoCreado = async (nuevo) => {
    setIsCreateOpen(false);
    await cargarArticulos();
    if (nuevo && onSelect) onSelect(nuevo);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Buscar Artículo">
      <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="Buscar por código o nombre..."
            className="w-full border p-2 rounded"
            value={filtro}
            onChange={e => setFiltro(e.target.value)}
            autoFocus
          />
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded bg-green-600 px-3 py-2 text-white transition hover:bg-green-700"
          >
            <Plus size={16} />
            Nuevo producto
          </button>
        </div>

        <p className="text-xs text-gray-500">Haz clic en una fila para seleccionar el artículo.</p>
        <table className="w-full border text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 py-1 text-left w-24">Cod Art</th>
              <th className="px-2 py-1 text-left">Nombre</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(art => (
              <tr
                key={art.codarticulo}
                className="border-b cursor-pointer hover:bg-blue-50 transition-colors"
                onClick={() => onSelect(art)}
                title="Seleccionar artículo"
              >
                <td className="px-2 py-1">{art.codarticulo}</td>
                <td className="px-2 py-1">{art.nombrearticulo || art.nombrecorto}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="2" className="text-center py-2 text-gray-400">
                  Sin resultados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isCreateOpen && (
        <CreateArticuloModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onCreated={handleProductoCreado}
        />
      )}
    </Modal>
  );
};

export default SearchArticuloModal;
