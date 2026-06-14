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

  // Misma agrupación que CreateModal: las filas con codfamilia de 6 dígitos
  // son subfamilias ("001002" => familia "001", subfamilia código "002").
  // El backend espera codsubfamilia como CÓDIGO (varchar(6)), no el nombre.
  const familyOptions = useMemo(() => {
    const map = new Map();
    rawFamilias
      .filter(r => r.subfamilia && r.subfamilia.trim() && r.codfamilia.length === 6)
      .forEach(r => {
        const fam = r.codfamilia.slice(0, 3);
        const sub = r.codfamilia.slice(3, 6);
        if (!map.has(fam)) {
          map.set(fam, { codfamilia: fam, familia: r.familia, subfamilias: [] });
        }
        if (!map.get(fam).subfamilias.some(s => s.code === sub)) {
          map.get(fam).subfamilias.push({ code: sub, label: r.subfamilia });
        }
      });
    // Incluir también familias top-level (3 dígitos) que aún no tengan subfamilias
    rawFamilias
      .filter(r => r.codfamilia.length === 3 && !map.has(r.codfamilia))
      .forEach(r => {
        map.set(r.codfamilia, { codfamilia: r.codfamilia, familia: r.familia, subfamilias: [] });
      });
    return Array.from(map.values());
  }, [rawFamilias]);

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
                <option key={sub.code} value={sub.code}>{sub.label}</option>
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