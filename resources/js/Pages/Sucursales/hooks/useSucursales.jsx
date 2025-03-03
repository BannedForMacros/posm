// src/hooks/useSucursales.js
import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

export function useSucursales() {
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cargar sucursales
  const loadSucursales = () => {
    setLoading(true);
    fetch('/api/sucursales', {
      headers: { 'Accept': 'application/json' }
    })
      .then(r => r.json())
      .then(data => {
        setSucursales(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error al cargar sucursales:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadSucursales();
  }, []);

  // Crear sucursal
  const crearSucursal = async (nueva, token) => {
    try {
      const res = await fetch('/api/sucursales', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': token
        },
        body: JSON.stringify(nueva)
      });
      if (!res.ok) {
        const msg = await res.json();
        throw new Error(msg.message || 'Error al crear la sucursal');
      }
      Swal.fire('Creado', 'Sucursal creada correctamente', 'success');
      loadSucursales(); // Recargamos la lista sin refrescar la página
    } catch (error) {
      Swal.fire('Error', error.message, 'error');
    }
  };

  // Editar sucursal
  const editarSucursal = async (id, actualizada, token) => {
    try {
      const res = await fetch(`/api/sucursales/${id}`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': token
        },
        body: JSON.stringify(actualizada)
      });
      if (!res.ok) {
        const msg = await res.json();
        throw new Error(msg.message || 'Error al actualizar sucursal');
      }
      Swal.fire('Actualizado', 'La sucursal se actualizó correctamente', 'success');
      loadSucursales();
    } catch (error) {
      Swal.fire('Error', error.message, 'error');
    }
  };

  // Eliminar sucursal
  const eliminarSucursal = async (id, token) => {
    const confirm = await Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción eliminará lógicamente la sucursal.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });
    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch(`/api/sucursales/${id}`, {
        method: 'DELETE',
        headers: {
          'X-CSRF-TOKEN': token
        }
      });
      if (!res.ok) {
        const msg = await res.json();
        throw new Error(msg.message || 'Error al eliminar sucursal');
      }
      Swal.fire('Eliminado', 'La sucursal ha sido eliminada.', 'success');
      loadSucursales();
    } catch (error) {
      Swal.fire('Error', error.message, 'error');
    }
  };

  return {
    sucursales,
    loading,
    crearSucursal,
    editarSucursal,
    eliminarSucursal
  };
}
