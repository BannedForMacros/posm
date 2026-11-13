// "Nuevo producto" desde Compras: mismo formulario y validaciones que el módulo Artículos.
import React from 'react';
import ArticuloModal from '@/Pages/ArticuloManage/components/ArticuloModal';
import { useFamiliasCatalogo } from '@/Pages/ArticuloManage/utils/articulo';

const CreateArticuloModal = ({ isOpen, onClose, onCreated, inicial = null }) => {
  const { familias, cargando } = useFamiliasCatalogo(isOpen);

  return (
    <ArticuloModal
      isOpen={isOpen}
      onClose={onClose}
      inicial={inicial}
      familias={familias}
      cargandoFamilias={cargando}
      onGuardado={(articulo) => {
        onCreated?.(articulo ?? null);
        onClose?.();
      }}
    />
  );
};

export default CreateArticuloModal;
