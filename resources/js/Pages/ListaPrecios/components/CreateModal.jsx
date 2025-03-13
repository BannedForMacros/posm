import React, { useState, useEffect } from 'react';
import ModalGrande from '@/Components/ui/ModalGrande';  // Tu modal grande
import Swal from 'sweetalert2';

const CreateModal = ({ isOpen, onClose, onCreated }) => {
  const [nombre, setNombre] = useState('');
  const [articulosOriginal, setArticulosOriginal] = useState([]); 
  const [articulosFiltrados, setArticulosFiltrados] = useState([]); 
  const [busqueda, setBusqueda] = useState('');

  // Para importar desde otra lista
  const [listas, setListas] = useState([]);
  const [listaOrigenId, setListaOrigenId] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Cargar artículos
      fetch('/api/articulos-manage')
        .then(r => r.json())
        .then(data => {
          const conPrecio = data.map(a => ({ ...a, precio: '' }));
          setArticulosOriginal(conPrecio);
          setArticulosFiltrados(conPrecio);
          setBusqueda('');
        })
        .catch(err => console.error(err));

      // Cargar listas de precios existentes
      fetch('/api/listaprecios')
        .then(r => r.json())
        .then(data => setListas(data))
        .catch(err => console.error(err));

      // Reset campos
      setNombre('');
      setListaOrigenId('');
    }
  }, [isOpen]);

  // Filtrar en tiempo real
  useEffect(() => {
    if (!busqueda.trim()) {
      setArticulosFiltrados(articulosOriginal);
    } else {
      const filtro = busqueda.toLowerCase();
      const filtrados = articulosOriginal.filter(a => {
        const nombreArt = a.nombrearticulo?.toLowerCase() || '';
        return nombreArt.includes(filtro);
      });
      setArticulosFiltrados(filtrados);
    }
  }, [busqueda, articulosOriginal]);

  const handleImportarPrecios = async () => {
    if (!listaOrigenId) {
      Swal.fire('Atención', 'Seleccione la lista de precios origen', 'warning');
      return;
    }

    const { isConfirmed } = await Swal.fire({
      title: '¿Importar precios?',
      text: 'Esto sobreescribirá los precios actuales de los artículos coincidentes.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, importar',
      cancelButtonText: 'Cancelar'
    });
    if (!isConfirmed) return;

    try {
      const res = await fetch(`/api/listaprecios/detalle/${listaOrigenId}`);
      if (!res.ok) throw new Error('Error al obtener detalles de la lista origen');
      const detalleOrigen = await res.json(); 

      // Mezclar precios
      const actualizados = articulosOriginal.map(art => {
        const itemOrigen = detalleOrigen.find(o => o.cod_articulo === art.codarticulo);
        if (itemOrigen) {
          return { ...art, precio: itemOrigen.precio?.toString() || '' };
        }
        return art;
      });

      setArticulosOriginal(actualizados);

      // Re-aplicamos el filtro actual
      const nuevosFiltrados = !busqueda.trim()
        ? actualizados
        : actualizados.filter(a => {
            const nombreArt = a.nombrearticulo?.toLowerCase() || '';
            return nombreArt.includes(busqueda.toLowerCase());
          });
      setArticulosFiltrados(nuevosFiltrados);

      Swal.fire('Éxito', 'Precios importados correctamente', 'success');
    } catch (error) {
      console.error('ImportarPrecios:', error);
      Swal.fire('Error', error.message, 'error');
    }
  };

  const handleCrear = async () => {
    if (!nombre.trim()) {
      Swal.fire('Error', 'Ingrese un nombre de lista', 'error');
      return;
    }
    const detalle = articulosOriginal.map(a => ({
      cod_articulo: a.codarticulo,
      precio: a.precio ? parseFloat(a.precio) : 0
    }));

    try {
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
      onClose();
    } catch (error) {
      Swal.fire('Error', error.message, 'error');
    }
  };

  return (
    <ModalGrande
      isOpen={isOpen}
      onClose={onClose}
      title="Crear Lista de Precios"
    >
      <div className="w-full mx-auto space-y-6 p-4">
        
        {/* Fila 1: Nombre de la lista + Importar lista existente */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nombre de la Lista */}
          <div>
            <label className="block text-sm font-semibold mb-1">Nombre de la Lista:</label>
            <input
              type="text"
              className="border rounded p-2 w-full"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
            />
          </div>

          {/* Importar desde Lista Existente */}
          <div>
            <label className="block text-sm font-semibold mb-1">
              Importar desde Lista Existente:
            </label>
            <div className="flex gap-2">
              <select
                className="border rounded p-2 flex-1"
                value={listaOrigenId}
                onChange={e => setListaOrigenId(e.target.value)}
              >
                <option value="">(Ninguna)</option>
                {listas.map(l => (
                  <option key={l.id} value={l.id}>
                    {l.nombre} {l.estado === 0 ? '(Inactiva)' : ''}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="bg-gray-600 text-white px-3 py-2 rounded hover:bg-gray-700 transition"
                onClick={handleImportarPrecios}
              >
                Importar
              </button>
            </div>
          </div>
        </div>

        {/* Fila 2: Buscador de artículos */}
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

        {/* Lista de artículos con precio */}
        <div className="border p-2 max-h-[300px] overflow-auto bg-white">
          <h3 className="font-bold mb-2">Artículos</h3>
          {articulosFiltrados.map((art, idx) => (
            <div key={art.codarticulo} className="flex items-center gap-2 mb-2">
              <span className="flex-1 text-sm">
                {art.nombrearticulo}
              </span>
              <label className="text-sm font-medium">Precio:</label>
              <input
                type="number"
                step="0.01"
                className="border p-1 w-24 text-right"
                value={art.precio}
                onChange={e => {
                  const copia = [...articulosFiltrados];
                  copia[idx].precio = e.target.value;
                  setArticulosFiltrados(copia);
                  // Actualizamos también en articulosOriginal
                  const originalIndex = articulosOriginal.findIndex(o => o.codarticulo === art.codarticulo);
                  if (originalIndex >= 0) {
                    const originalCopy = [...articulosOriginal];
                    originalCopy[originalIndex].precio = e.target.value;
                    setArticulosOriginal(originalCopy);
                  }
                }}
              />
            </div>
          ))}
          {articulosFiltrados.length === 0 && (
            <div className="text-gray-500 text-sm">
              No se encontraron artículos con ese filtro.
            </div>
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
