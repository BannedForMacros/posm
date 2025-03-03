import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

export const useArticulos = () => {
  const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
  const [articulos, setArticulos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCrearModalOpen, setIsCrearModalOpen] = useState(false);
  const [isEditarModalOpen, setIsEditarModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [articuloEditar, setArticuloEditar] = useState(null);
  const [articuloView, setArticuloView] = useState(null);
  const [nuevoArticulo, setNuevoArticulo] = useState({
    codarticulo: '',
    codfamilia: '',
    nombrearticulo: '',
    estado: 1
  });

  const fetchArticulos = async () => {
    try {
      const response = await fetch('/api/articulos-manage', {
        headers: {
          'Accept': 'application/json',
          'X-CSRF-TOKEN': token
        }
      });
      if (!response.ok) throw new Error('Error al cargar artículos');
      const data = await response.json();
      setArticulos(Array.isArray(data) ? data : []);
    } catch (error) {
      Swal.fire('Error', error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const crearArticulo = async (nuevoArticulo) => {
    try {
      const response = await fetch('/api/articulos-manage', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': token
        },
        body: JSON.stringify(nuevoArticulo)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Error al crear artículo');

      setArticulos(prev => [...prev, data.data]);
      setIsCrearModalOpen(false);
      Swal.fire('¡Éxito!', 'Artículo creado correctamente', 'success');
    } catch (error) {
      Swal.fire('Error', error.message, 'error');
    }
  };

  const actualizarArticulo = async (articulo) => {
    try {
      const response = await fetch(`/api/articulos-manage/${articulo.codarticulo}`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': token
        },
        body: JSON.stringify(articulo)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Error al actualizar artículo');

      setArticulos(prev => prev.map(a => 
        a.codarticulo === articulo.codarticulo ? data.data : a
      ));
      setIsEditarModalOpen(false);
      Swal.fire('¡Éxito!', 'Artículo actualizado correctamente', 'success');
    } catch (error) {
      Swal.fire('Error', error.message, 'error');
    }
  };

  const eliminarArticulo = async (codarticulo) => {
    try {
      const result = await Swal.fire({
        title: '¿Estás seguro?',
        text: "Esta acción no se puede revertir",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
      });

      if (result.isConfirmed) {
        const response = await fetch(`/api/articulos-manage/${codarticulo}`, {
          method: 'DELETE',
          headers: {
            'Accept': 'application/json',
            'X-CSRF-TOKEN': token
          }
        });

        if (!response.ok) throw new Error('Error al eliminar artículo');

        setArticulos(prev => prev.filter(a => a.codarticulo !== codarticulo));
        Swal.fire('¡Eliminado!', 'Artículo eliminado correctamente', 'success');
      }
    } catch (error) {
      Swal.fire('Error', error.message, 'error');
    }
  };

  useEffect(() => {
    fetchArticulos();
  }, []);

  return {
    articulos,
    loading,
    isCrearModalOpen,
    isEditarModalOpen,
    isViewModalOpen,
    articuloEditar,
    articuloView,
    nuevoArticulo,
    setIsCrearModalOpen,
    setIsEditarModalOpen,
    setIsViewModalOpen,
    setArticuloEditar,
    setArticuloView,
    setNuevoArticulo,
    crearArticulo,
    actualizarArticulo,
    eliminarArticulo
  };
};