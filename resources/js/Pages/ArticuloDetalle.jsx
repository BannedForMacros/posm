import React, { useState, useEffect } from 'react';
import { Inertia } from '@inertiajs/inertia';
import { Button } from '@/components/ui/Button'; // Verifica que la ruta sea correcta

const ArticuloDetalle = ({ id }) => {
  const [articulo, setArticulo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Consulta la API para obtener los detalles del artículo por ID
    fetch(`/api/articulos/${id}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Error en la respuesta de la red');
        }
        return response.json();
      })
      .then(data => {
        setArticulo(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching article details:', error);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return <div className="container mx-auto p-4">Cargando...</div>;
  }

  if (!articulo) {
    return <div className="container mx-auto p-4">No se encontraron datos.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Detalle del Artículo</h1>
      <div className="bg-white shadow rounded-lg p-6">
        <div className="mb-4"><strong>Código:</strong> {articulo.codarticulo}</div>
        <div className="mb-4"><strong>Familia:</strong> {articulo.codfamilia}</div>
        <div className="mb-4"><strong>Subfamilia:</strong> {articulo.codsubfamilia}</div>
        <div className="mb-4"><strong>Nombre:</strong> {articulo.nombrearticulo}</div>
        <div className="mb-4"><strong>Nombre Corto:</strong> {articulo.nombrecorto}</div>
        <div className="mb-4"><strong>Stock Mínimo:</strong> {articulo.stockminimo}</div>
        <div className="mb-4"><strong>Stock Máximo:</strong> {articulo.stockmaximo}</div>
        <div className="mb-4"><strong>Tipo IGV:</strong> {articulo.tipoigv}</div>
        <div className="mb-4"><strong>Código de Barras:</strong> {articulo.codbarra}</div>
        <div className="mb-4"><strong>Foto:</strong> {articulo.foto}</div>
        <div className="mb-4"><strong>Código SUNAT:</strong> {articulo.codigosunat}</div>
        <div className="mb-4"><strong>ICBPER:</strong> {articulo.icbper}</div>
        <div className="mb-4"><strong>Monto ICBPER:</strong> {articulo.montoicbper}</div>
        <div className="mb-4"><strong>Control de Peso:</strong> {articulo.controlpeso}</div>
        <div className="mb-4"><strong>Código Artículo Nuevo:</strong> {articulo.codartnue}</div>
        <div className="mb-4"><strong>Estado:</strong> {articulo.estado}</div>
        <Button variant="secondary" onClick={() => Inertia.visit('/articulos')}>
          Volver a la Lista
        </Button>
      </div>
    </div>
  );
};

export default ArticuloDetalle;
