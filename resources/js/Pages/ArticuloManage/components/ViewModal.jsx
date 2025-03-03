import React from 'react';
import Modal from '@/Components/ui/Modal';
import EstadoIndicador from '@/Components/ui/EstadoIndicador';

export const ViewModal = ({
  isOpen,
  onClose,
  articulo
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalle de Artículo"
    >
      {articulo && (
        <div className="space-y-4">
          <div className="form-group">
            <label className="block text-sm font-medium text-gray-700">
              Código
              <div className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 p-2">
                {articulo.codarticulo}
              </div>
            </label>
          </div>

          <div className="form-group">
            <label className="block text-sm font-medium text-gray-700">
              Familia
              <div className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 p-2">
                {articulo.codfamilia}
              </div>
            </label>
          </div>

          <div className="form-group">
            <label className="block text-sm font-medium text-gray-700">
              Nombre Artículo
              <div className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 p-2">
                {articulo.nombrearticulo}
              </div>
            </label>
          </div>

          <div className="form-group">
            <label className="block text-sm font-medium text-gray-700">
              Estado
              <div className="mt-1">
                <EstadoIndicador estado={articulo.estado} />
              </div>
            </label>
          </div>
        </div>
      )}
    </Modal>
  );
};