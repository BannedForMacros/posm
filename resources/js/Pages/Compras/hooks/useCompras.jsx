import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

export function useCompras() {
  const [facturaciones, setFacturaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cargar la lista de compras
  // Carga de facturaciones
  const loadFacturaciones = () => {
    setLoading(true);
    fetch('/api/facturacion')
      .then((r) => r.json())
      .then((data) => {
        setFacturaciones(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error al cargar facturaciones:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadFacturaciones();
  }, []);


  // Crear una nueva compra
  const crearCompra = async (nuevaCompra) => {
    try {
      const res = await fetch('/api/facturacion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
        },
        body: JSON.stringify(nuevaCompra),
      });
  
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Error al crear la compra');
      }
  
      Swal.fire('¡Éxito!', 'Compra creada correctamente', 'success');
      loadFacturaciones(); // Recarga los datos
      
      return data; // Devuelve los datos para posible uso
  
    } catch (error) {
      Swal.fire('Error', error.message, 'error');
      throw error; // Propaga el error para manejar en el componente
    }
  };

  // Editar una compra
  const editarCompra = async (id, compraEditada) => {
    try {
      const res = await fetch(`/api/facturacion/${id}`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(compraEditada),
      });
      if (!res.ok) {
        const msg = await res.json();
        throw new Error(msg.message || 'Error al actualizar la compra');
      }
      Swal.fire('Actualizado', 'La compra se actualizó correctamente', 'success');
      loadFacturaciones();
    } catch (error) {
      Swal.fire('Error', error.message, 'error');
    }
  };

  // Eliminar compra
  const eliminarCompra = async (id) => {
    const confirm = await Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción eliminará la compra de forma lógica.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });
    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch(`/api/facturacion/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const msg = await res.json();
        throw new Error(msg.message || 'Error al eliminar la compra');
      }
      Swal.fire('Eliminado', 'La compra ha sido eliminada.', 'success');
      loadFacturaciones();
    } catch (error) {
      Swal.fire('Error', error.message, 'error');
    }
  };

  return {
    facturaciones,
    loading,
    crearCompra,
    editarCompra,
    eliminarCompra,
    loadFacturaciones,

  };
}
