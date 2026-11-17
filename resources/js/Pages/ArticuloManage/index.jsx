// Gestión de artículos de la empresa activa.
import React, { useMemo, useState } from 'react';
import MainLayout from '@/Layouts/MainLayout';
import DataTable from 'react-data-table-component';
import IconButton from '@/Components/ui/IconButton';
import EstadoIndicador from '@/Components/ui/EstadoIndicador';
import { Plus, Edit, Eye, Trash2, Search, PackageOpen } from 'lucide-react';
import { useArticulos, toast } from './hooks/useArticulos';
import ArticuloModal from './components/ArticuloModal';
import { ViewModal } from './components/ViewModal';
import { customStyles } from './styles/tableStyles';
import { codigoVisible, coincideArticulo, nombresFamilia, useFamiliasCatalogo, useUnidadesMedida } from './utils/articulo';

const ArticulosManage = () => {
  const { articulos, loading, error, fetchArticulos, eliminarArticulo } = useArticulos();
  const { familias, cargando: cargandoFamilias, recargar: recargarFamilias } = useFamiliasCatalogo();

  const unidades = useUnidadesMedida();
  const siglaUnidad = (row) => unidades.find((u) => Number(u.codunidad) === Number(row.codunidad ?? 1))?.siglasunat ?? '';
  const [busqueda, setBusqueda] = useState('');
  const [formulario, setFormulario] = useState({ abierto: false, articulo: null });
  const [detalle, setDetalle] = useState(null);

  const filtrados = useMemo(
    () => articulos.filter((a) => coincideArticulo(a, busqueda)),
    [articulos, busqueda]
  );

  const abrirFormulario = (articulo = null) => {
    recargarFamilias(); // por si se crearon familias en otra pestaña
    setFormulario({ abierto: true, articulo });
  };

  const alGuardar = async (_, mensaje) => {
    setFormulario({ abierto: false, articulo: null });
    await fetchArticulos();
    toast(mensaje || 'Guardado');
  };

  const columns = [
    {
      name: 'Código',
      selector: (row) => codigoVisible(row),
      sortable: true,
      width: '150px',
      cell: (row) => <span className="font-mono text-sm">{codigoVisible(row)}</span>,
    },
    { name: 'Nombre', selector: (row) => row.nombrearticulo, sortable: true, grow: 3, wrap: true },
    { name: 'Unidad', selector: (row) => siglaUnidad(row), sortable: true, width: '100px' },
    { name: 'Familia', selector: (row) => nombresFamilia(familias, row).familia, sortable: true, grow: 1.5 },
    { name: 'Subfamilia', selector: (row) => nombresFamilia(familias, row).subfamilia, sortable: true, grow: 1.5 },
    {
      name: 'Cód. barras',
      selector: (row) => row.codbarra ?? '',
      cell: (row) => <span className="font-mono text-sm text-gray-600">{row.codbarra}</span>,
      grow: 1.5,
    },
    { name: 'Estado', cell: (row) => <EstadoIndicador estado={row.estado} />, width: '130px' },
    {
      name: 'Acciones',
      width: '150px',
      cell: (row) => (
        <div className="flex gap-2">
          <IconButton icon={Eye} label="Ver" variant="info" size="sm" onClick={() => setDetalle(row)} />
          <IconButton icon={Edit} label="Editar" variant="warning" size="sm" onClick={() => abrirFormulario(row)} />
          <IconButton icon={Trash2} label="Eliminar" variant="danger" size="sm" onClick={() => eliminarArticulo(row)} />
        </div>
      ),
    },
  ];

  const vacio = (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <PackageOpen className="h-10 w-10 text-gray-300" />
      {busqueda ? (
        <p className="text-gray-500">Ningún artículo coincide con “{busqueda}”.</p>
      ) : (
        <>
          <p className="text-gray-500">Aún no hay artículos registrados.</p>
          <IconButton icon={Plus} label="Crear el primero" variant="primary" size="md" onClick={() => abrirFormulario()} />
        </>
      )}
    </div>
  );

  return (
    <MainLayout>
      <div className="w-full rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Artículos</h1>
            <p className="text-sm text-gray-500 tabular-nums">
              {loading ? 'Cargando…' : `${articulos.length} artículo(s) activos`}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                className="h-10 w-full rounded-lg border border-gray-300 pl-9 pr-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/40 sm:w-80"
                placeholder="Buscar por código, nombre o cód. barras"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <IconButton icon={Plus} label="Crear artículo" variant="primary" size="md" onClick={() => abrirFormulario()} />
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>
            <button type="button" className="font-semibold underline" onClick={fetchArticulos}>Reintentar</button>
          </div>
        )}

        <DataTable
          columns={columns}
          data={filtrados}
          customStyles={customStyles}
          progressPending={loading}
          progressComponent={
            <div className="w-full space-y-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded bg-gray-100" />
              ))}
            </div>
          }
          noDataComponent={vacio}
          pagination
          paginationPerPage={25}
          paginationRowsPerPageOptions={[25, 50, 100]}
          fixedHeader
          fixedHeaderScrollHeight="65vh"
          highlightOnHover
        />

        <ArticuloModal
          isOpen={formulario.abierto}
          articulo={formulario.articulo}
          familias={familias}
          cargandoFamilias={cargandoFamilias}
          onClose={() => setFormulario({ abierto: false, articulo: null })}
          onGuardado={alGuardar}
        />

        <ViewModal isOpen={Boolean(detalle)} onClose={() => setDetalle(null)} articulo={detalle} familias={familias} unidades={unidades} />
      </div>
    </MainLayout>
  );
};

export default ArticulosManage;
