// resources/js/Pages/Ventas/hooks/useVentas.jsx
import { useState, useEffect } from 'react';

export function useVentas() {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cargar ventas
  const loadVentas = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ventas', {
        headers: { 'Accept': 'application/json' },
      });
      const data = await res.json();
      // Si el backend respondió con un error {error, message}, no es un array
      setVentas(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error al cargar ventas:', error);
    } finally {
      setLoading(false);
    }
  };

  // Crear una nueva venta
  const crearVenta = async (nuevaVenta) => {
    // Aquí tu endpoint. Suponiendo que lo manejarás
    // en un endpoint distinto (p.ej. /api/ventas con method POST),
    // o podrías tener un /api/ventas/create, etc.
    try {
      const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
      const res = await fetch('/api/ventas', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': token
        },
        body: JSON.stringify(nuevaVenta),
      });
      if (!res.ok) {
        const msg = await res.json();
        throw new Error(msg.message || 'Error al crear la venta');
      }
      // Si se crea con éxito, recargamos la lista
      await loadVentas();
      return true;
    } catch (error) {
      console.error('Error al crear venta:', error);
      throw error;
    }
  };

  useEffect(() => {
    loadVentas();
  }, []);

  return {
    ventas,
    loading,
    loadVentas,
    crearVenta,
  };
}
