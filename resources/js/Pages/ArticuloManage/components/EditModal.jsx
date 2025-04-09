import React, { useState, useEffect, useMemo } from 'react';
import Modal from '@/Components/ui/Modal';
import EstadoIndicador from '@/Components/ui/EstadoIndicador';
import axios from 'axios';

export const EditModal = ({
  isOpen,
  onClose,
  articulo,
  setArticulo,
  onSubmit,
  soloVer,
  familias: familiasProp = []
}) => {
  const [rawFamilias, setRawFamilias] = useState(familiasProp);

  useEffect(() => {
    if (isOpen) {
      if (!familiasProp || familiasProp.length === 0) {
        axios
          .get('/api/familias')
          .then((res) => setRawFamilias(res.data))
          .catch((err) => console.error('Error al cargar familias:', err));
      } else {
        setRawFamilias(familiasProp);
      }
    }
  }, [isOpen, familiasProp]);

  const groupedByFamilyName = useMemo(() => {
    const map = new Map();
    rawFamilias.forEach(({ codfamilia, familia, subfamilia }) => {
      if (!map.has(familia)) {
        map.set(familia, {
          familia,
          representativeCodfamilia: codfamilia,
          subfamilias: []
        });
      }
      if (subfamilia && !map.get(familia).subfamilias.includes(subfamilia)) {
        map.get(familia).subfamilias.push(subfamilia);
      }
    });
    return Array.from(map.values());
  }, [rawFamilias]);

  const familyOptions = useMemo(() => groupedByFamilyName.map(item => ({
    familia: item.familia,
    codfamilia: item.representativeCodfamilia,
    subfamilias: item.subfamilias
  })), [groupedByFamilyName]);

  const selectedFamily = useMemo(() => {
    if (!articulo) return null;
    return familyOptions.find(opt => opt.codfamilia === articulo.codfamilia);
  }, [familyOptions, articulo]);
  

  const filteredSubfamilias = selectedFamily ? selectedFamily.subfamilias : [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={soloVer ? 'Ver Artículo' : 'Editar Artículo'}
    >
      {articulo && (
        <div className="space-y-4">
          {/* Código (solo lectura) */}
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Código</span>
            <input
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm"
              value={articulo.codarticulo || ''}
              readOnly
            />
          </label>

          {/* Nombre del artículo */}
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Nombre del Artículo</span>
            <input
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={articulo.nombrearticulo || ''}
              onChange={(e) => setArticulo({ ...articulo, nombrearticulo: e.target.value })}
              readOnly={soloVer}
            />
          </label>

          {/* Familia */}
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Familia</span>
            <select
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={articulo.codfamilia || ''}
              onChange={(e) => setArticulo({ ...articulo, codfamilia: e.target.value, codsubfamilia: '' })}
              disabled={soloVer}
            >
              <option value="">Seleccione una familia</option>
              {familyOptions.map((opt) => (
                <option key={opt.codfamilia} value={opt.codfamilia}>
                  {opt.familia}
                </option>
              ))}
            </select>
          </label>

          {/* Subfamilia */}
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Subfamilia</span>
            <select
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={articulo.codsubfamilia || ''}
              onChange={(e) => setArticulo({ ...articulo, codsubfamilia: e.target.value })}
              disabled={soloVer}
            >
              <option value="">Seleccione una subfamilia</option>
              {filteredSubfamilias.map((sub) => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </label>

          {/* Estado */}
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Estado</span>
            {soloVer ? (
              <div className="mt-1">
                <EstadoIndicador estado={articulo.estado} />
              </div>
            ) : (
              <select
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={articulo.estado}
                onChange={(e) => setArticulo({ ...articulo, estado: parseInt(e.target.value) })}
              >
                <option value={1}>Activo</option>
                <option value={0}>Inactivo</option>
              </select>
            )}
          </label>

          {/* Botón Guardar */}
          {!soloVer && (
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
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

export default EditModal;