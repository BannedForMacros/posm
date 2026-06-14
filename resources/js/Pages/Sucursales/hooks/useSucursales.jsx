// src/hooks/useSucursales.js
import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

export function useSucursales() {
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);

  // Función para cargar sucursales desde la API, sin cache
  const loadSucursales = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/sucursales', {
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        cache: 'no-store'
      });
      if (!response.ok) {
        throw new Error('Error al cargar sucursales');
      }
      const data = await response.json();
<<<<<<< HEAD
      setSucursales(Array.isArray(data) ? data : []);
=======
      // Verifica si "data" es un array, o si está envuelto en una propiedad "data"
      setSucursales(
        Array.isArray(data)
          ? data
          : data.data
            ? data.data
            : []
      );
>>>>>>> 0534e466fbc86a6fcd308a81f78de42db62daf18
    } catch (error) {
      console.error('Error al cargar sucursales:', error);
      Swal.fire('Error', error.message, 'error');
    } finally {
      setLoading(false);
    }
  };
  

  // Cargar sucursales al montar el hook
  useEffect(() => {
    loadSucursales();
  }, []);

// Crear sucursal y refrescar la lista
const crearSucursal = async (nuevaSucursal) => {
  try {
    const token = document
      .querySelector('meta[name="csrf-token"]')
      .getAttribute('content');

    const response = await fetch('/api/sucursales', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': token,
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify(nuevaSucursal)
    });

    // Si la respuesta no es OK, parseamos el error:
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al crear la sucursal');
    }

    // Parseamos también la respuesta exitosa:
    const data = await response.json();
    // Asumiendo que tu API responde algo como { message: 'Sucursal creada correctamente', success: true }

    Swal.fire('Creado', data.message || 'Sucursal creada correctamente', 'success');

    // Al final, recargamos la lista real desde la BD:
    await loadSucursales();

  } catch (error) {
    Swal.fire('Error', error.message, 'error');
  }
};


  // Editar sucursal y refrescar la lista
  const editarSucursal = async (id, actualizada) => {
    try {
      const token = document
        .querySelector('meta[name="csrf-token"]')
        .getAttribute('content');
      const response = await fetch(`/api/sucursales/${id}`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': token,
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(actualizada)
      });
      if (!response.ok) {
        const msg = await response.json();
        throw new Error(msg.message || 'Error al actualizar sucursal');
      }
      Swal.fire('Actualizado', 'La sucursal se actualizó correctamente', 'success');
      await loadSucursales();
    } catch (error) {
      Swal.fire('Error', error.message, 'error');
    }
  };

  // Eliminar sucursal y refrescar la lista
  const eliminarSucursal = async (id, token) => {
    const confirm = await Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción eliminará la sucursal.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });
    if (!confirm.isConfirmed) return;
    try {
      const response = await fetch(`/api/sucursales/${id}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'X-CSRF-TOKEN': token,
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
      if (!response.ok) {
        const msg = await response.json();
        throw new Error(msg.message || 'Error al eliminar sucursal');
      }
      Swal.fire('Eliminado', 'La sucursal ha sido eliminada.', 'success');
      await loadSucursales();
    } catch (error) {
      Swal.fire('Error', error.message, 'error');
    }
  };

  return {
    sucursales,
    loading,
    loadSucursales,
    crearSucursal,
    editarSucursal,
    eliminarSucursal
  };
}
