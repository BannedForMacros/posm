import React, { useState, useEffect } from 'react';
import Modal from '@/Components/ui/Modal';
import axios from 'axios';
import { usePage } from '@inertiajs/react';

export const CreateModal = ({
  isOpen,
  onClose,
  nuevoArticulo,
  setNuevoArticulo,
  onSubmit,
  familias: familiasProp = [] // Recibimos familias desde el index (si vienen)
}) => {
  const { auth } = usePage().props;
  // Mantenemos un estado local para las familias. Si ya vienen por prop, los usamos.
  const [familias, setFamilias] = useState(familiasProp);

  // Si el modal se abre y no hay familias, podemos cargarlas desde la API
  useEffect(() => {
    if (isOpen && (!familiasProp || familiasProp.length === 0)) {
      axios
        .get('/api/familias') // Ajusta esta URL según tu endpoint real
        .then(response => {
          // Suponemos que la respuesta es un array
          setFamilias(response.data);
        })
        .catch(error => {
          console.error('Error al cargar familias:', error);
        });
    } else {
      // Si vienen por prop, actualizamos el estado local
      setFamilias(familiasProp);
    }
  }, [isOpen, familiasProp]);

  // useEffect para asignar el RUC al nuevo artículo (sin mostrarlo)
  useEffect(() => {
    setNuevoArticulo(prev => ({
      ...prev,
      ruc: auth.user.ruc || ''
    }));
  }, [auth.user.ruc, setNuevoArticulo]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Crear Nuevo Artículo"
    >
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
                codarticulo: e.target.value
              })
            }
            required
          />
        </label>

        {/*  Campo Nombre del Artículo */}
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

        {/* Selector de Familia */}
        <label className="block">
          <span className="text-sm font-medium text-gray-700">
            Familia: <span className="text-red-500">*</span>
          </span>
          <select
              value={nuevoArticulo.codfamilia || ''}       // <-- Usamos codfamilia
              onChange={(e) =>
                setNuevoArticulo({
                  ...nuevoArticulo,
                  codfamilia: e.target.value              // <-- Asignamos a codfamilia
                })
              }
              required
            >
              <option value="">Seleccione una familia</option>
              {(familias || []).map(fam => (
                <option key={fam.codfamilia} value={fam.codfamilia}>
                  {fam.familia || 'Sin nombre'}
                </option>
              ))}
            </select>

        </label>




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
