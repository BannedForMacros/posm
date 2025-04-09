import React, { useState, useEffect, useMemo } from 'react';
import Modal from '@/Components/ui/Modal';
import axios from 'axios';
import { usePage } from '@inertiajs/react';

export const CreateModal = ({
  isOpen,
  onClose,
  nuevoArticulo,
  setNuevoArticulo,
  onSubmit,
  familias: familiasProp = []
}) => {
  const { auth } = usePage().props;

  // Aquí guardamos todas las filas que vienen del backend (familias repetidas por subfamilia)
  const [rawFamilias, setRawFamilias] = useState(familiasProp);

  // Cuando se abre el modal, si no tenemos familias por props, pedimos al backend
  useEffect(() => {
    if (isOpen) {
      if (!familiasProp || familiasProp.length === 0) {
        axios
          .get('/api/familias')
          .then((response) => {
            setRawFamilias(response.data);
          })
          .catch((error) => {
            console.error('Error al cargar familias:', error);
          });
      } else {
        setRawFamilias(familiasProp);
      }
    }
  }, [isOpen, familiasProp]);

  // Asignar el RUC al nuevo artículo de forma automática
  useEffect(() => {
    setNuevoArticulo((prev) => ({
      ...prev,
      ruc: auth.user.ruc || ''
    }));
  }, [auth.user.ruc, setNuevoArticulo]);

  /**
   * Agrupamos por 'familia' en lugar de 'codfamilia'.
   * Ejemplo de estructura final en groupedByFamilyName:
   *   {
   *     'WTB': {
   *       familia: 'WTB',
   *       representativeCodfamilia: '020008', // tomamos el primero que aparezca
   *       subfamilias: ['TCS', 'MANGOS', 'LLANTAS', ...]
   *     },
   *     'MASCOTAS': {
   *       familia: 'MASCOTAS',
   *       representativeCodfamilia: '020002',
   *       subfamilias: ['ARTICULOS PARA MASCOTAS']
   *     },
   *     ...
   *   }
   */
  const groupedByFamilyName = useMemo(() => {
    const map = new Map(); // key = nombre de la familia, value = { familia, representativeCodfamilia, subfamilias: [] }

    rawFamilias.forEach((row) => {
      const { codfamilia, familia, subfamilia } = row;

      // Si no existe la familia en el mapa, la creamos
      if (!map.has(familia)) {
        map.set(familia, {
          familia,
          representativeCodfamilia: codfamilia, // guardamos el primer codfamilia que veamos
          subfamilias: []
        });
      }

      // Si hay subfamilia, la agregamos (evitando duplicados)
      if (subfamilia && subfamilia.trim() !== '') {
        const entry = map.get(familia);
        if (!entry.subfamilias.includes(subfamilia)) {
          entry.subfamilias.push(subfamilia);
        }
      }
    });

    // Convertimos el map en un array de objetos
    return Array.from(map.values());
  }, [rawFamilias]);

  // Este array lo usaremos para el <select> de familia
  // Solo mostrará una opción por cada "familia" (nombre), ignorando que existan múltiples codfamilia.
  // Cuando el usuario elija la familia, asignaremos representativeCodfamilia a nuevoArticulo.codfamilia
  // y unimos las subfamilias en un solo array.
  const familyOptions = useMemo(() => {
    return groupedByFamilyName.map((item) => ({
      familia: item.familia,
      codfamilia: item.representativeCodfamilia,
      subfamilias: item.subfamilias
    }));
  }, [groupedByFamilyName]);

  // Buscamos la familia seleccionada en base a 'codfamilia'
  // OJO: Aquí en el front-end estamos guardando la selección en nuevoArticulo.codfamilia
  // y la "familia" de texto no se guarda (solo la codfamilia).
  const selectedFamily = useMemo(() => {
    return familyOptions.find(
      (opt) => opt.codfamilia === nuevoArticulo.codfamilia
    );
  }, [familyOptions, nuevoArticulo.codfamilia]);

  // Subfamilias que mostraremos en el <select> de subfamilia
  const filteredSubfamilias = selectedFamily ? selectedFamily.subfamilias : [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Crear Nuevo Artículo">
      <div className="space-y-4">
        {/* Campo: Código */}
        <label className="block">
          <span className="text-sm font-medium text-gray-700">
            Código: <span className="text-red-500">*</span>
          </span>
          <input
            type="number"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={nuevoArticulo.codarticulo || ''}
            onChange={(e) =>
              setNuevoArticulo({
                ...nuevoArticulo,
                codarticulo: parseInt(e.target.value, 10) || ''
              })
            }
            required
          />
        </label>

        {/* Campo: Nombre del Artículo */}
        <label className="block">
          <span className="text-sm font-medium text-gray-700">
            Nombre del Artículo:
          </span>
          <input
            type="text"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={nuevoArticulo.nombrearticulo || ''}
            onChange={(e) =>
              setNuevoArticulo({
                ...nuevoArticulo,
                nombrearticulo: e.target.value
              })
            }
          />
        </label>

        {/* Selector de Familia (agrupada por nombre) */}
        <label className="block">
          <span className="text-sm font-medium text-gray-700">
            Familia: <span className="text-red-500">*</span>
          </span>
          <select
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={nuevoArticulo.codfamilia || ''}
            onChange={(e) => {
              // Cuando cambia la familia, asignamos el codfamilia representativo
              const codfamSeleccionada = e.target.value;
              setNuevoArticulo({
                ...nuevoArticulo,
                codfamilia: codfamSeleccionada,
                codsubfamilia: '' // reiniciamos subfamilia
              });
            }}
            required
          >
            <option value="">Seleccione una familia</option>
            {familyOptions.map((opt) => (
              <option key={opt.codfamilia} value={opt.codfamilia}>
                {opt.familia}
              </option>
            ))}
          </select>
        </label>

        {/* Selector de Subfamilia */}
        <label className="block">
          <span className="text-sm font-medium text-gray-700">
            Subfamilia:
          </span>
          <select
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={nuevoArticulo.codsubfamilia || ''}
            onChange={(e) =>
              setNuevoArticulo({
                ...nuevoArticulo,
                codsubfamilia: e.target.value
              })
            }
          >
            <option value="">Seleccione una subfamilia</option>
            {filteredSubfamilias.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>
        </label>

        {/* Botones de acción */}
        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            onClick={onSubmit}
          >
            Guardar
          </button>
        </div>
      </div>
    </Modal>
  );
};
