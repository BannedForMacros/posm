import { useEffect, useState } from 'react';

export function useWarehouseMovements() {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filtros locales
  const [almacenId, setAlmacenId] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchMovements();
  }, [almacenId, search]);

  async function fetchMovements() {
    setLoading(true);
    try {
      let url = '/api/warehouse-movements?';
      if (almacenId) {
        url += `almacen_id=${almacenId}&`;
      }
      if (search) {
        url += `search=${search}&`;
      }
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error('Error al obtener movimientos');
      }
      const data = await res.json();
      setMovements(data);
    } catch (error) {
      console.error('Error al obtener movimientos:', error);
    } finally {
      setLoading(false);
    }
  }

  return {
    movements,
    loading,
    almacenId,
    setAlmacenId,
    search,
    setSearch
  };
}
