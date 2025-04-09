// src/Pages/Familias/components/CreateModal.jsx
import React, { useState, useEffect } from 'react';
import Modal from '@/Components/ui/Modal';
// Importa el CSS del switch (ajusta la ruta si es necesario)
import '../styles/Switch.css'; 

export const CreateModal = ({
  isOpen,
  onClose,
  nuevaFamilia,
  setNuevaFamilia,
  familias,   // La lista de familias deduplicadas pasada desde el index
  onSubmit
}) => {
  // Estado local para el toggle de subfamilia
  const [isSubfamilia, setIsSubfamilia] = useState(false);

  // Al abrir el modal, resetea el formulario y el toggle
  useEffect(() => {
    if (isOpen) {
      setNuevaFamilia({ 
        codfamilia: '', 
        familia: '', 
        subfamilia: '',
        codfamiliaPadre: ''  // Opcional, para almacenar el código del padre
      });
      setIsSubfamilia(false);
    }
  }, [isOpen, setNuevaFamilia]);

  // Maneja el cambio del switch
  const handleSwitchChange = (e) => {
    setIsSubfamilia(e.target.checked);
    if (e.target.checked) {
      // Forzamos que el usuario seleccione en el select (vacía la familia y el código del padre)
      setNuevaFamilia({ ...nuevaFamilia, familia: '', codfamiliaPadre: '' });
    }
  };

  // Maneja los cambios en los inputs que no sean del select
  const handleInputChange = (campo, valor) => {
    setNuevaFamilia({ ...nuevaFamilia, [campo]: valor });
  };

  // Maneja el cambio del select para elegir una familia existente.
  // Se obtiene el código seleccionado y, a partir del array de familias,
  // se busca el objeto correspondiente para extraer su nombre.
  const handleFamilySelect = (e) => {
    const selectedCode = e.target.value;
    const selectedFamily = familias.find(f => f.codfamilia === selectedCode);
    setNuevaFamilia({
      ...nuevaFamilia,
      // Asigna el nombre de la familia en el campo "familia"
      familia: selectedFamily ? selectedFamily.familia : '',
      // Guarda también el código seleccionado en un campo auxiliar (opcional)
      codfamiliaPadre: selectedCode,
    });
  };

  // Llama la función onSubmit (definida en el padre) para crear la familia
  const handleSubmit = () => {
    onSubmit();
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Crear Nueva Familia / Subfamilia">
      <div className="space-y-4 p-4">
        {/* Campo para Código */}
        <label className="block">
          <span className="text-sm font-semibold">Código:</span>
          <input
            type="text"
            className="mt-1 block w-full border p-2 rounded"
            value={nuevaFamilia.codfamilia}
            onChange={(e) => handleInputChange('codfamilia', e.target.value)}
          />
        </label>

        {/* Switch visual para indicar si es subfamilia */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-semibold">¿Es subfamilia?</span>
          <label className="switch">
            <input
              type="checkbox"
              checked={isSubfamilia}
              onChange={handleSwitchChange}
            />
            <span className="slider"></span>
          </label>
        </div>

        {/* Si isSubfamilia es true, se muestra el select; sino, un input para escribir el nombre de la familia */}
        {isSubfamilia ? (
          <label className="block">
            <span className="text-sm font-semibold">Familia Existente:</span>
            <select
              className="mt-1 block w-full border p-2 rounded"
              // Aquí usamos el campo auxiliar "codfamiliaPadre" para vincular el valor del select
              value={nuevaFamilia.codfamiliaPadre || ''}
              onChange={handleFamilySelect}
            >
              <option value="">Seleccione una familia</option>
              {familias.map((f) => (
                <option key={f.codfamilia} value={f.codfamilia}>
                  {f.familia}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label className="block">
            <span className="text-sm font-semibold">Familia:</span>
            <input
              type="text"
              className="mt-1 block w-full border p-2 rounded"
              value={nuevaFamilia.familia}
              onChange={(e) => handleInputChange('familia', e.target.value)}
            />
          </label>
        )}

        {/* Campo para Subfamilia */}
        <label className="block">
          <span className="text-sm font-semibold">Subfamilia:</span>
          <input
            type="text"
            className="mt-1 block w-full border p-2 rounded"
            value={nuevaFamilia.subfamilia}
            onChange={(e) => handleInputChange('subfamilia', e.target.value)}
          />
        </label>

        <button
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
          onClick={handleSubmit}
        >
          Guardar
        </button>
      </div>
    </Modal>
  );
};
