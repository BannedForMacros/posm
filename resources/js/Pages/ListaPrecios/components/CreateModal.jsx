import React, { useState, useEffect } from 'react';
import ModalGrande from '@/Components/ui/ModalGrande';  // Tu modal grande
import Swal from 'sweetalert2';

const CreateModal = ({ isOpen, onClose, onCreated }) => {
  const [nombre, setNombre] = useState('');
  const [articulosOriginal, setArticulosOriginal] = useState([]); // lista completa
  const [articulosFiltrados, setArticulosFiltrados] = useState([]); // lista filtrada
  const [busqueda, setBusqueda] = useState(''); // texto para filtrar

  useEffect(() => {
    if (isOpen) {
      // Cargar artículos
      fetch('/api/articulos-manage')
        .then(r => r.json())
        .then(data => {
          // Agregamos la propiedad precio a cada artículo
          const conPrecio = data.map(a => ({ ...a, precio: '' }));
          setArticulosOriginal(conPrecio);
          setArticulosFiltrados(conPrecio); // al inicio, no hay filtro
          setBusqueda('');
        })
        .catch(err => console.error(err));
    }
  }, [isOpen]);

  // Filtrar en tiempo real
  useEffect(() => {
    if (!busqueda.trim()) {
      // si no hay texto, mostrar todos
      setArticulosFiltrados(articulosOriginal);
    } else {
      const filtro = busqueda.toLowerCase();
      const filtrados = articulosOriginal.filter(a => {
        const nombre = a.nombrearticulo?.toLowerCase() || '';
        return nombre.includes(filtro);
      });
      setArticulosFiltrados(filtrados);
    }
  }, [busqueda, articulosOriginal]);

  const handleCrear = async () => {
    if (!nombre.trim()) {
      Swal.fire('Error', 'Ingrese un nombre de lista', 'error');
      return;
    }
    // Preparamos el detalle
    const detalle = articulosFiltrados.map(a => ({
      cod_articulo: a.codarticulo,
      precio: a.precio ? parseFloat(a.precio) : 0
    }));

    try {
      // CSRF token
      const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

      const res = await fetch('/api/listaprecios', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': token
        },
        body: JSON.stringify({ nombre, detalle })
      });

      if (!res.ok) {
        throw new Error('Error al crear lista');
      }

      Swal.fire('Éxito', 'Lista creada', 'success');
      if (onCreated) onCreated();
    } catch (error) {
      Swal.fire('Error', error.message, 'error');
    }
  };

  return (
    <ModalGrande isOpen={isOpen} onClose={onClose} title="Crear Lista de Precios">
      <div className="w-full mx-auto space-y-6 p-4">
        
        {/* Encabezado: Nombre de la lista */}
        <div>
          <label className="block text-sm font-semibold mb-1">Nombre de la Lista:</label>
          <input
            type="text"
            className="border rounded p-2 w-full"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
          />
        </div>

        {/* Buscador en tiempo real */}
        <div>
          <label className="block text-sm font-semibold mb-1">Buscar Artículo:</label>
          <input
            type="text"
            className="border rounded p-2 w-full"
            placeholder="Escriba para filtrar artículos..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
        </div>

        {/* Tabla/Lista de Artículos Filtrados */}
        <div className="border p-2 max-h-[300px] overflow-auto bg-white">
          <h3 className="font-bold mb-2">Artículos</h3>
          {articulosFiltrados.map((art, idx) => (
            <div key={art.codarticulo} className="flex items-center gap-2 mb-2">
              {/* Nombre del artículo */}
              <span className="flex-1 text-sm">{art.nombrearticulo}</span>
              {/* Etiqueta de precio */}
              <label className="text-sm font-medium">Precio:</label>
              {/* Input para asignar precio */}
              <input
                type="number"
                step="0.01"
                className="border p-1 w-24 text-right"
                value={art.precio}
                onChange={e => {
                  const copia = [...articulosFiltrados];
                  copia[idx].precio = e.target.value;
                  setArticulosFiltrados(copia);
                }}
              />
            </div>
          ))}
          {articulosFiltrados.length === 0 && (
            <div className="text-gray-500 text-sm">No se encontraron artículos con ese filtro.</div>
          )}
        </div>

        {/* Botones finales */}
        <div className="flex justify-end gap-3 border-t pt-4">
          <button
            type="button"
            className="rounded bg-gray-400 px-4 py-2 text-white transition hover:bg-gray-500"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="rounded bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
            onClick={handleCrear}
          >
            Crear
          </button>
        </div>
      </div>
    </ModalGrande>
  );
};

export default CreateModal;
