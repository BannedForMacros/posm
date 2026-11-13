// useArticulos.js — listado y baja de artículos de la empresa activa.
import { useCallback, useEffect, useState } from 'react';
import Swal from 'sweetalert2';

export const useArticulos = () => {
  const [articulos, setArticulos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchArticulos = useCallback(async () => {
    setError(null);
    try {
      const response = await fetch('/api/articulos-manage', { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error('No se pudieron cargar los artículos.');
      const data = await response.json();
      setArticulos(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const eliminarArticulo = async (articulo) => {
    const { isConfirmed } = await Swal.fire({
      title: '¿Eliminar artículo?',
      html: `Se dará de baja <b>${String(articulo.nombrearticulo ?? '').replace(/</g, '&lt;')}</b>.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      focusCancel: true,
    });
    if (!isConfirmed) return;

    try {
      const response = await fetch(`/api/articulos-manage/${articulo.codarticulo}`, {
        method: 'DELETE',
        headers: { Accept: 'application/json' },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'No se pudo eliminar el artículo.');
      setArticulos((prev) => prev.filter((a) => a.codarticulo !== articulo.codarticulo));
      toast('Artículo eliminado');
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    }
  };

  useEffect(() => {
    fetchArticulos();
  }, [fetchArticulos]);

  return { articulos, loading, error, fetchArticulos, eliminarArticulo };
};

export const toast = (title, icon = 'success') =>
  Swal.fire({ toast: true, position: 'top-end', icon, title, showConfirmButton: false, timer: 2200, timerProgressBar: true });
