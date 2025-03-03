import React from 'react';
import Modal from '@/Components/ui/Modal';
import EstadoIndicador from '@/Components/ui/EstadoIndicador';

export const EditModal = ({
  isOpen,
  onClose,
  articulo,
  setArticulo,
  onSubmit,
  soloVer
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={soloVer ? "Ver Artículo" : "Editar Artículo"}
    >
      {articulo && (
        <div className="space-y-4">
          <div className="form-group">
            <label className="block text-sm font-medium text-gray-700">
              Código
              <input
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm"
                value={articulo.codarticulo}
                readOnly
              />
            </label>
          </div>

          <div className="form-group">
            <label className="block text-sm font-medium text-gray-700">
              Familia
              <input
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm 
                  focus:border-indigo-500 focus:ring-indigo-500"
                value={articulo.codfamilia}
                onChange={(e) => setArticulo({...articulo, codfamilia: e.target.value})}
                readOnly={soloVer}
              />
            </label>
          </div>

          <div className="form-group">
            <label className="block text-sm font-medium text-gray-700">
              Nombre Artículo
              <input
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm 
                  focus:border-indigo-500 focus:ring-indigo-500"
                value={articulo.nombrearticulo}
                onChange={(e) => setArticulo({...articulo, nombrearticulo: e.target.value})}
                readOnly={soloVer}
              />
            </label>
          </div>

          <div className="form-group">
            <label className="block text-sm font-medium text-gray-700">
              Estado
              {soloVer ? (
                <div className="mt-1">
                  <EstadoIndicador estado={articulo.estado} />
                </div>
              ) : (
                <select
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm 
                    focus:border-indigo-500 focus:ring-indigo-500"
                  value={articulo.estado}
                  onChange={(e) => setArticulo({
                    ...articulo,
                    estado: parseInt(e.target.value)
                  })}
                >
                  <option value={1}>Activo</option>
                  <option value={0}>Inactivo</option>
                </select>
              )}
            </label>
          </div>

          {!soloVer && (
            <div className="mt-4 flex justify-end space-x-2">
              <button
                type="button"
                className="inline-flex justify-center rounded-md border border-transparent 
                  bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm 
                  hover:bg-indigo-700 focus:outline-none focus:ring-2 
                  focus:ring-indigo-500 focus:ring-offset-2"
                onClick={onSubmit}
              >
                Actualizar
              </button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};