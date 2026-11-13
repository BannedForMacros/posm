import React from 'react';
import Modal from '@/Components/ui/Modal';
import EstadoIndicador from '@/Components/ui/EstadoIndicador';
import { codigoVisible, nombresFamilia } from '../utils/articulo';

const Dato = ({ label, children, mono }) => (
  <div>
    <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</dt>
    <dd className={`mt-1 text-gray-900 ${mono ? 'font-mono' : ''}`}>{children || <span className="text-gray-400">—</span>}</dd>
  </div>
);

const num = (v) => (v == null ? '' : Number(v).toLocaleString('es-PE', { maximumFractionDigits: 4 }));

export const ViewModal = ({ isOpen, onClose, articulo, familias = [] }) => {
  const { familia, subfamilia } = nombresFamilia(familias, articulo);
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detalle del artículo">
      {articulo && (
        <dl className="grid grid-cols-1 gap-5 p-1 sm:grid-cols-2">
          <Dato label="Código" mono>{codigoVisible(articulo)}</Dato>
          <Dato label="Código de barras" mono>{articulo.codbarra}</Dato>
          <div className="sm:col-span-2"><Dato label="Nombre">{articulo.nombrearticulo}</Dato></div>
          <div className="sm:col-span-2"><Dato label="Nombre corto">{articulo.nombrecorto}</Dato></div>
          <Dato label="Familia">{familia}</Dato>
          <Dato label="Subfamilia">{subfamilia}</Dato>
          <Dato label="Stock mínimo"><span className="tabular-nums">{num(articulo.stockminimo)}</span></Dato>
          <Dato label="Stock máximo"><span className="tabular-nums">{num(articulo.stockmaximo)}</span></Dato>
          <Dato label="Estado"><EstadoIndicador estado={articulo.estado} /></Dato>
        </dl>
      )}
    </Modal>
  );
};
