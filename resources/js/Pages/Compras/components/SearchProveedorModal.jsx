import React, { useState, useEffect } from 'react';
import Modal from '@/Components/ui/Modal';

const SearchProveedorModal = ({ isOpen, onClose, onSelect }) => {
  const [filtro, setFiltro] = useState('');
  const [proveedores, setProveedores] = useState([]);

  useEffect(() => {
    if (isOpen) {
      // Cargar lista de proveedores o dejarlos fijos
      fetch('/api/proveedores')
        .then(r => r.json())
        .then(data => setProveedores(data))
        .catch(err => console.error(err));
    }
  }, [isOpen]);

  const filtered = proveedores.filter(p =>
    p.ruc.includes(filtro) || 
    (p.razon_social || '').toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Buscar Proveedor">
      <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
        <input
          type="text"
          placeholder="Buscar por RUC o razón social..."
          className="w-full border p-2 rounded"
          value={filtro}
          onChange={e => setFiltro(e.target.value)}
        />
        <p className="text-xs text-gray-500">Haz clic en una fila para seleccionar el proveedor.</p>
        <table className="w-full border text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 py-1 text-left w-32">RUC</th>
              <th className="px-2 py-1 text-left">Razón Social</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(prov => (
              <tr
                key={prov.id}
                className="border-b cursor-pointer hover:bg-blue-50 transition-colors"
                onClick={() => onSelect(prov)}
                title="Seleccionar proveedor"
              >
                <td className="px-2 py-1">{prov.ruc}</td>
                <td className="px-2 py-1">{prov.razon_social}</td>
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
    </Modal>
  );
};

export default SearchProveedorModal;
