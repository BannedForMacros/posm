import React, { useState, useEffect } from 'react';
import DataTable from 'react-data-table-component';
import { Button } from '@/components/ui/Button';
import { Inertia } from '@inertiajs/inertia';
import MainLayout from '@/Layouts/MainLayout';

const Articulos = () => {
  const [articulos, setArticulos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/articulos')
      .then(response => {
        if (!response.ok) throw new Error('Error en la respuesta de la red');
        return response.json();
      })
      .then(data => {
        setArticulos(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching articles:', error);
        setLoading(false);
      });
  }, []);

  const columns = [
    {
      name: 'Código',
      selector: row => row.codarticulo,
      sortable: true,
      width: '100px',
    },
    {
      name: 'Nombre',
      selector: row => row.nombrearticulo,
      sortable: true,
      grow: 2,
    },
    {
      name: 'Nombre Corto',
      selector: row => row.nombrecorto,
      sortable: true,
    },
    {
      name: 'Estado',
      selector: row => row.estado,
      sortable: true,
      center: true,
      width: '100px',
    },
    {
      name: 'Acciones',
      cell: row => (
        <Button
          variant="primary"
          size="sm"
          onClick={() => Inertia.visit(`/articulos/${row.codarticulo}`)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M10 3C5 3 1.73 7.11 1 10c.73 2.89 4 7 9 7s8.27-4.11 9-7c-.73-2.89-5-7-9-7z" />
            <path d="M10 7a3 3 0 100 6 3 3 0 000-6z" />
          </svg>
        </Button>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
      width: '120px',
    },
  ];

  return (
    <MainLayout>
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Lista de Artículos</h1>
        <div className="bg-white shadow rounded-lg p-4">
          <DataTable
            columns={columns}
            data={articulos}
            progressPending={loading}
            pagination
            highlightOnHover
            striped
            responsive
            noHeader
          />
        </div>
      </div>
    </MainLayout>
  );
};

export default Articulos;
