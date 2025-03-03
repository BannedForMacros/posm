import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

export function useAlmacenes() {
  const [almacenes, setAlmacenes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados para modales (ejemplo estilo "Familias")
  const [isCrearModalOpen, setIsCrearModalOpen] = useState(false);
  const [isEditarModalOpen, setIsEditarModalOpen] = useState(false);

  // Almacén a editar
  const [almacenEditar, setAlmacenEditar] = useState(null);

  // Cargar almacenes
  const loadAlmacenes = () => {
    setLoading(true);
    fetch('/api/almacenes', {
      headers: { 'Accept': 'application/json' }
    })
      .then(r => r.json())
      .then(data => {
        setAlmacenes(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error al cargar almacenes:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadAlmacenes();
  }, []);

  // Crear almacén
  const crearAlmacen = async (nuevo) => {
    try {
      const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

      const res = await fetch('/api/almacenes', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': token
        },
        body: JSON.stringify(nuevo)
      });

      if (!res.ok) {
        const msg = await res.json();
        throw new Error(msg.message || 'Error al crear el almacén');
      }

      Swal.fire('Creado', 'Almacén creado correctamente', 'success');
      loadAlmacenes(); // Recarga la lista
    } catch (error) {
      Swal.fire('Error', error.message, 'error');
    }
  };

  // Actualizar almacén
  const actualizarAlmacen = async (id, data) => {
    try {
      const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

      const res = await fetch(`/api/almacenes/${id}`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': token
        },
        body: JSON.stringify(data)
      });

      if (!res.ok) {
        const msg = await res.json();
        throw new Error(msg.message || 'Error al actualizar el almacén');
      }

      Swal.fire('Actualizado', 'Almacén actualizado correctamente', 'success');
      loadAlmacenes();
    } catch (error) {
      Swal.fire('Error', error.message, 'error');
    }
  };

  // Eliminar almacén
  const eliminarAlmacen = async (id) => {
    const confirm = await Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción eliminará lógicamente el almacén.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (!confirm.isConfirmed) return;

    try {
      const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

      const res = await fetch(`/api/almacenes/${id}`, {
        method: 'DELETE',
        headers: {
          'X-CSRF-TOKEN': token
        }
      });

      if (!res.ok) {
        const msg = await res.json();
        throw new Error(msg.message || 'Error al eliminar el almacén');
      }

      Swal.fire('Eliminado', 'El almacén ha sido eliminado.', 'success');
      loadAlmacenes();
    } catch (error) {
      Swal.fire('Error', error.message, 'error');
    }
  };

  return {
    almacenes,
    loading,

    // Modales
    isCrearModalOpen,
    setIsCrearModalOpen,
    isEditarModalOpen,
    setIsEditarModalOpen,
    almacenEditar,
    setAlmacenEditar,

    // Métodos CRUD
    crearAlmacen,
    actualizarAlmacen,
    eliminarAlmacen,
    loadAlmacenes
  };
}
