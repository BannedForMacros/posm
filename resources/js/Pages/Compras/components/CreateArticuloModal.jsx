import React, { useState } from 'react';
import Modal from '@/Components/ui/Modal';
import Swal from 'sweetalert2';

const CreateArticuloModal = ({ isOpen, onClose, onCreated }) => {
  const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

  const initial = {
    nombrearticulo: '',
    nombrecorto: '',
    codbarra: '',
    stockminimo: '',
    stockmaximo: '',
  };
  const [articulo, setArticulo] = useState(initial);
  const [guardando, setGuardando] = useState(false);

  const setField = (field, value) => setArticulo(prev => ({ ...prev, [field]: value }));

  const handleCrearArticulo = async () => {
    if (!articulo.nombrearticulo.trim()) {
      Swal.fire('Advertencia', 'Ingrese el nombre del producto', 'warning');
      return;
    }
    setGuardando(true);
    try {
      // codarticulo lo autogenera el backend; familia/subfamilia son opcionales.
      const res = await fetch('/api/articulos-manage', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': token,
        },
        body: JSON.stringify({
          nombrearticulo: articulo.nombrearticulo.trim(),
          nombrecorto: articulo.nombrecorto.trim() || articulo.nombrearticulo.trim().slice(0, 50),
          codbarra: articulo.codbarra.trim() || null,
          stockminimo: articulo.stockminimo || 0,
          stockmaximo: articulo.stockmaximo || 0,
        }),
      });

      if (!res.ok) {
        const msg = await res.json();
        throw new Error(msg.message || 'Error al crear el producto');
      }

      const data = await res.json();
      setArticulo(initial);
      // Devolvemos el artículo creado para refrescar/seleccionar en el buscador
      if (onCreated) onCreated(data.data || null);
      onClose();
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nuevo producto">
      <div className="p-4 space-y-4">
        <label className="block">
          <span className="text-sm font-semibold">Nombre del producto: *</span>
          <input
            type="text"
            className="mt-1 block w-full border rounded p-2"
            placeholder="Ej. Arroz Costeño 750g"
            value={articulo.nombrearticulo}
            onChange={(e) => setField('nombrearticulo', e.target.value)}
            autoFocus
          />
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm font-semibold">Nombre corto:</span>
            <input
              type="text"
              className="mt-1 block w-full border rounded p-2"
              placeholder="(opcional)"
              value={articulo.nombrecorto}
              onChange={(e) => setField('nombrecorto', e.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold">Código de barras:</span>
            <input
              type="text"
              className="mt-1 block w-full border rounded p-2"
              placeholder="(opcional)"
              value={articulo.codbarra}
              onChange={(e) => setField('codbarra', e.target.value)}
            />
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm font-semibold">Stock mínimo:</span>
            <input
              type="number"
              step="0.01"
              className="mt-1 block w-full border rounded p-2"
              placeholder="0"
              value={articulo.stockminimo}
              onChange={(e) => setField('stockminimo', e.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold">Stock máximo:</span>
            <input
              type="number"
              step="0.01"
              className="mt-1 block w-full border rounded p-2"
              placeholder="0"
              value={articulo.stockmaximo}
              onChange={(e) => setField('stockmaximo', e.target.value)}
            />
          </label>
        </div>

        <p className="text-xs text-gray-500">
          El código del producto se asigna automáticamente. Podrás completar familia, IGV y
          más detalles luego en el módulo de Artículos.
        </p>

        <div className="flex justify-end gap-3 pt-2 border-t">
          <button
            type="button"
            className="rounded bg-gray-400 px-4 py-2 text-white transition hover:bg-gray-500"
            onClick={onClose}
            disabled={guardando}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="rounded bg-green-600 px-4 py-2 text-white transition hover:bg-green-700 disabled:opacity-60"
            onClick={handleCrearArticulo}
            disabled={guardando}
          >
            {guardando ? 'Guardando...' : 'Guardar producto'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default CreateArticuloModal;
