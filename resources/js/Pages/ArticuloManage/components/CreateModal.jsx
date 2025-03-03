import React from 'react';
import Modal from '@/Components/ui/Modal';
import { usePage } from '@inertiajs/react';

export const CreateModal = ({
  isOpen,
  onClose,
  nuevoArticulo,
  setNuevoArticulo,
  onSubmit,
  familias
}) => {
  const { auth } = usePage().props;

  React.useEffect(() => {
    setNuevoArticulo(prev => ({
      ...prev,
      ruc: auth.user.ruc || ''
    }));
  }, []);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Crear Nuevo Artículo"
    >
      <div className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-gray-700">RUC:</span>
          <input
            type="text"
            className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm"
            value={nuevoArticulo.ruc}
            readOnly
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-gray-700">
            Código: <span className="text-red-500">*</span>
          </span>
          <input
            type="number"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm 
              focus:border-indigo-500 focus:ring-indigo-500"
            value={nuevoArticulo.codarticulo}
            onChange={(e) => setNuevoArticulo({
              ...nuevoArticulo,
              codarticulo: e.target.value
            })}
            required
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-gray-700">
            Familia: <span className="text-red-500">*</span>
          </span>
          <select
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm 
                focus:border-indigo-500 focus:ring-indigo-500"
              value={nuevoArticulo.familia_id}
              onChange={(e) => setNuevoArticulo({
                ...nuevoArticulo,
                familia_id: e.target.value
              })}
              required
            >
              <option value="">Seleccione una familia</option>
              {(familias || []).map(familia => (
                <option key={familia.id} value={familia.id}>
                  {familia.familia}
                </option>
              ))}
            </select>

        </label>

        {/* ... Resto de campos ... */}

        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            className="inline-flex justify-center rounded-md border border-gray-300 
              bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm 
              hover:bg-gray-50 focus:outline-none focus:ring-2 
              focus:ring-indigo-500 focus:ring-offset-2"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="inline-flex justify-center rounded-md border border-transparent 
              bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm 
              hover:bg-indigo-700 focus:outline-none focus:ring-2 
              focus:ring-indigo-500 focus:ring-offset-2"
            onClick={onSubmit}
          >
            Guardar
          </button>
        </div>
      </div>
    </Modal>
  );
};