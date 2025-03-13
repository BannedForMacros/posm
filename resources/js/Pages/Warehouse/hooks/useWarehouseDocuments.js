import { useEffect, useState } from 'react';

export function useWarehouseDocuments() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  async function fetchDocuments() {
    setLoading(true);
    try {
      const res = await fetch('/api/warehouse-documents');
      if (!res.ok) {
        throw new Error('Error al obtener documentos');
      }
      const data = await res.json();
      setDocuments(data);
    } catch (error) {
      console.error('Error al obtener documentos:', error);
    } finally {
      setLoading(false);
    }
  }

  return {
    documents,
    loading,
  };
}
