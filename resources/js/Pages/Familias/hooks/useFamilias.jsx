import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

export const useFamilias = () => {
  const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
  const [familias, setFamilias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCrearModalOpen, setIsCrearModalOpen] = useState(false);
  const [isEditarModalOpen, setIsEditarModalOpen] = useState(false);
  const [familiaEditar, setFamiliaEditar] = useState(null);
  const [soloVer, setSoloVer] = useState(false);
  const [nuevaFamilia, setNuevaFamilia] = useState({
    codfamilia: '',
    familia: '',
    subfamilia: '',
  });

  const fetchFamilias = async () => {
    try {
      const response = await fetch('/api/familias', {
        headers: {
          'Accept': 'application/json',
          'X-CSRF-TOKEN': token
        }
      });
      const data = await response.json();
      setFamilias(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setFamilias([]);
    } finally {
      setLoading(false);
    }
  };

  const crearFamilia = async (nuevaFamilia) => {
    try {
      const response = await fetch('/api/familias', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': token
        },
        body: JSON.stringify(nuevaFamilia),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al crear familia');
      }

      const data = await response.json();
      setFamilias(prev => [...prev, data.data]);
      setIsCrearModalOpen(false);
      Swal.fire('¡Éxito!', 'Familia creada correctamente', 'success');
    } catch (error) {
      Swal.fire('Error', error.message, 'error');
    }
  };

  const actualizarFamilia = async (familiaEditar) => {
    try {
      const response = await fetch(`/api/familias/${familiaEditar.codfamilia}`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': token
        },
        body: JSON.stringify(familiaEditar),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al actualizar familia');
      }

      const data = await response.json();
      setFamilias(prev =>
        prev.map(f => f.codfamilia === familiaEditar.codfamilia ? data.data : f)
      );
      setIsEditarModalOpen(false);
      Swal.fire('¡Éxito!', 'Familia actualizada correctamente', 'success');
    } catch (error) {
      Swal.fire('Error', error.message, 'error');
    }
  };

  const eliminarFamilia = async (codfamilia) => {
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
        const response = await fetch(`/api/familias/${codfamilia}`, {
          method: 'DELETE',
          headers: {
            'Accept': 'application/json',
            'X-CSRF-TOKEN': token
          },
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Error al eliminar familia');
        }

        setFamilias(prev => prev.filter(f => f.codfamilia !== codfamilia));
        Swal.fire('¡Eliminado!', 'La familia ha sido eliminada', 'success');
      }
    } catch (error) {
      Swal.fire('Error', error.message, 'error');
    }
  };

  useEffect(() => {
    fetchFamilias();
  }, []);

  return {
    familias,
    loading,
    isCrearModalOpen,
    isEditarModalOpen,
    familiaEditar,
    soloVer,
    nuevaFamilia,
    setIsCrearModalOpen,
    setIsEditarModalOpen,
    setFamiliaEditar,
    setSoloVer,
    setNuevaFamilia,
    crearFamilia,
    actualizarFamilia,
    eliminarFamilia,
  };
};