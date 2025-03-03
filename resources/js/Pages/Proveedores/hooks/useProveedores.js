import { useState, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';

export function useProveedores() {
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);

  // CSRF token
  const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

  // Convertimos loadProveedores a una función memoizada con useCallback
  const loadProveedores = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/proveedores');
      const data = await response.json();
      setProveedores(data);
    } catch (err) {
      console.error('Error al cargar proveedores:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProveedores();
  }, [loadProveedores]);

  // Crear un nuevo proveedor
  const crearProveedor = async (nuevo) => {
    try {
      const res = await fetch('/api/proveedores', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': token
        },
        body: JSON.stringify(nuevo),
      });

      if (!res.ok) {
        const msg = await res.json();
        throw new Error(msg.message || 'Error al crear el proveedor');
      }

      const data = await res.json();
      await Swal.fire('Creado', data.message, 'success');
      await loadProveedores();
      return data;
    } catch (error) {
      Swal.fire('Error', error.message, 'error');
      throw error;
    }
  };

  // Editar un proveedor
  const editarProveedor = async (id, actualizado) => {
    try {
      const res = await fetch(`/api/proveedores/${id}`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': token
        },
        body: JSON.stringify(actualizado),
      });

      if (!res.ok) {
        const msg = await res.json();
        throw new Error(msg.message || 'Error al actualizar el proveedor');
      }

      const data = await res.json();
      await Swal.fire('Actualizado', data.message, 'success');
      await loadProveedores();
      return data;
    } catch (error) {
      Swal.fire('Error', error.message, 'error');
      throw error;
    }
  };

  // Eliminar proveedor
  const eliminarProveedor = async (id) => {
    const confirm = await Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción eliminará lógicamente el proveedor.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });
    
    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch(`/api/proveedores/${id}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'X-CSRF-TOKEN': token
        }
      });

      if (!res.ok) {
        const msg = await res.json();
        throw new Error(msg.message || 'Error al eliminar el proveedor');
      }

      const data = await res.json();
      await Swal.fire('Eliminado', data.message, 'success');
      await loadProveedores();
      return data;
    } catch (error) {
      Swal.fire('Error', error.message, 'error');
      throw error;
    }
  };

  return {
    proveedores,
    loading,
    loadProveedores, // Ahora exportamos loadProveedores
    crearProveedor,
    editarProveedor,
    eliminarProveedor
  };
}