import React, { useState, useEffect } from 'react';
import ModalGrande from '@/Components/ui/ModalGrande';
import Swal from 'sweetalert2';

const ViewAndEditModal = ({ isOpen, onClose, listaPreciosId }) => {
  // Nombre de la lista
  const [nombreLista, setNombreLista] = useState('');

  // Lista completa (para no perder artículos al filtrar)
  const [detallesOriginal, setDetallesOriginal] = useState([]);
  // Lista filtrada (lo que se muestra en pantalla)
  const [detallesFiltrados, setDetallesFiltrados] = useState([]);

  // Modo edición
  const [modoEdicion, setModoEdicion] = useState(false);
  // Loading
  const [loading, setLoading] = useState(false);

  // Búsqueda en tiempo real
  const [busqueda, setBusqueda] = useState('');

  // Cargar datos cuando se abra el modal y tengamos un ID válido
  useEffect(() => {
    if (isOpen && listaPreciosId) {
      cargarDetalle();
    }
  }, [isOpen, listaPreciosId]);

  // Función para cargar la lista y su detalle
// Función para cargar la lista y su detalle
const cargarDetalle = async () => {
  setLoading(true);
  try {
    const res = await fetch(`/api/listaprecios/detalle/${listaPreciosId}`);
    const data = await res.json();
    // Si la respuesta es un objeto que tiene el nombre de la lista y el detalle,
    // usamos esos valores; de lo contrario usamos el fallback
    if (data.nombre_lista) {
      setNombreLista(data.nombre_lista);
      setDetallesOriginal(data.detalle);
      setDetallesFiltrados(data.detalle);
    } else {
      // Si la respuesta es un array, asumimos que no viene el nombre, y usamos el fallback.
      setNombreLista(`Lista #${listaPreciosId}`);
      setDetallesOriginal(data);
      setDetallesFiltrados(data);
    }
    setBusqueda('');
  } catch (error) {
    console.error('Error al cargar detalle:', error);
  } finally {
    setLoading(false);
  }
};


  // Filtrar en tiempo real
  useEffect(() => {
    if (!busqueda.trim()) {
      setDetallesFiltrados(detallesOriginal);
    } else {
      const filtro = busqueda.toLowerCase();
      const filtrados = detallesOriginal.filter(item => {
        const nombre = item.nombre_articulo?.toLowerCase() || '';
        return nombre.includes(filtro);
      });
      setDetallesFiltrados(filtrados);
    }
  }, [busqueda, detallesOriginal]);

  // Guardar cambios
  const handleGuardarCambios = async () => {
    try {
      // Armamos body con los precios (y si tu backend lo requiere, el nombre)
      const body = detallesFiltrados.map(d => ({
        id: d.id,
        precio: d.precio
      }));

      // CSRF token (si tu Laravel lo necesita)
      const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

      const res = await fetch(`/api/listaprecios/detalle/${listaPreciosId}`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': token
        },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error('Error al actualizar detalle');

      Swal.fire('Éxito', 'Precios actualizados', 'success');
      setModoEdicion(false);
      cargarDetalle();
    } catch (error) {
      Swal.fire('Error', error.message, 'error');
    }
  };

  // Cerrar modal y reset
  const handleClose = () => {
    setModoEdicion(false);
    onClose();
  };

  return (
    <ModalGrande
      isOpen={isOpen}
      onClose={handleClose}
      title="Detalle de Lista de Precios"
    >
      <div className="p-4 space-y-4">
        {loading ? (
          <div>Cargando...</div>
        ) : (
          <div className="space-y-4">
            {/* Nombre de la lista + Botón Editar/Guardar en la misma fila */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <label className="block text-sm font-semibold mb-1">Nombre de la Lista:</label>
                {modoEdicion ? (
                  <input
                    type="text"
                    className="border p-2 rounded w-full"
                    value={nombreLista}
                    onChange={e => setNombreLista(e.target.value)}
                  />
                ) : (
                  <div className="text-lg font-bold">{nombreLista}</div>
                )}
              </div>
              <div className="ml-4">
                {!modoEdicion ? (
                  <button
                    className="bg-blue-500 text-white px-4 py-2 rounded"
                    onClick={() => setModoEdicion(true)}
                  >
                    Editar
                  </button>
                ) : (
                  <button
                    className="bg-green-600 text-white px-4 py-2 rounded"
                    onClick={handleGuardarCambios}
                  >
                    Guardar
                  </button>
                )}
              </div>
            </div>

            {/* Buscador */}
            <div>
              <label className="block text-sm font-semibold mb-1">Buscar Artículo:</label>
              <input
                type="text"
                className="border p-2 w-full rounded"
                placeholder="Filtrar artículos..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
              />
            </div>

            {/* Lista de artículos */}
            <div className="border p-2 max-h-[300px] overflow-auto bg-white">
              {detallesFiltrados.map((item, idx) => (
                <div key={item.id} className="flex items-center gap-2 mb-2">
                  <span className="flex-1 text-sm">
                    {item.nombre_articulo || 'Artículo'}
                  </span>
                  {modoEdicion ? (
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium">Precio:</label>
                      <input
                        type="number"
                        step="0.01"
                        className="border p-1 w-24 text-right"
                        value={item.precio}
                        onChange={e => {
                          const copia = [...detallesFiltrados];
                          copia[idx].precio = e.target.value;
                          setDetallesFiltrados(copia);
                        }}
                      />
                    </div>
                  ) : (
                    <span className="w-24 text-right">
                      {parseFloat(item.precio).toFixed(2)}
                    </span>
                  )}
                </div>
              ))}
              {detallesFiltrados.length === 0 && (
                <div className="text-gray-500 text-sm">
                  No hay artículos que coincidan con el filtro.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Botón Cerrar al final */}
        <div className="flex justify-end">
          <button
            className="bg-gray-300 text-black px-4 py-2 rounded"
            onClick={handleClose}
          >
            Cerrar
          </button>
        </div>
      </div>
    </ModalGrande>
  );
};

export default ViewAndEditModal;
