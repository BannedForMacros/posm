import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

export function useListaPrecios() {
  const [listas, setListas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cargar listas
  const loadListas = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/listaprecios');
      const data = await res.json();
      setListas(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadListas();
  }, []);

  // Desactivar lista
  const desactivarLista = async (id) => {
    const confirm = await Swal.fire({
      title: '¿Desactivar esta lista?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, desactivar',
      cancelButtonText: 'Cancelar'
    });
    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch(`/api/listaprecios/desactivar/${id}`, {
        method: 'PUT'
      });
      if (!res.ok) throw new Error('Error al desactivar lista');
      Swal.fire('Éxito', 'Lista desactivada', 'success');
      loadListas();
    } catch (error) {
      Swal.fire('Error', error.message, 'error');
    }
  };

  return {
    listas,
    loading,
    desactivarLista,
    loadListas
  };
}
