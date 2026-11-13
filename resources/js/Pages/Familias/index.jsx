// Familias y subfamilias de la empresa activa.
import React, { useMemo, useState } from 'react';
import MainLayout from '@/Layouts/MainLayout';
import DataTable from 'react-data-table-component';
import IconButton from '@/Components/ui/IconButton';
import { Plus, Edit, Trash2, Search, FolderTree, CornerDownRight } from 'lucide-react';
import { useFamilias } from './hooks/useFamilias';
import { CreateModal } from './components/CreateModal';
import { customStyles } from './styles/tableStyles';

const Familias = () => {
  const { familias, loading, error, fetchFamilias, crearFamilia, actualizarFamilia, eliminarFamilia } = useFamilias();
  const [busqueda, setBusqueda] = useState('');
  const [modal, setModal] = useState({ abierto: false, editar: null, padre: null });

  const padres = useMemo(
    () => familias.filter((f) => f.codfamilia.length === 3)
      .sort((a, b) => a.familia.localeCompare(b.familia, 'es', { sensitivity: 'base' })),
    [familias]
  );

  // Orden jerárquico: cada familia seguida de sus subfamilias.
  const filas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return [...familias]
      .sort((a, b) => a.codfamilia.localeCompare(b.codfamilia))
      .filter((f) => !q || [f.codfamilia, f.familia, f.subfamilia].some((v) => String(v ?? '').toLowerCase().includes(q)));
  }, [familias, busqueda]);

  const abrir = (cfg = {}) => setModal({ abierto: true, editar: null, padre: null, ...cfg });
  const cerrar = () => setModal({ abierto: false, editar: null, padre: null });

  const columns = [
    {
      name: 'Código',
      selector: (r) => r.codfamilia,
      width: '120px',
      cell: (r) => <span className="font-mono text-sm tabular-nums">{r.codfamilia}</span>,
    },
    {
      name: 'Nombre',
      grow: 3,
      cell: (r) =>
        r.codfamilia.length === 6 ? (
          <span className="flex items-center gap-2 pl-4 text-gray-700">
            <CornerDownRight className="h-4 w-4 text-gray-400" />
            {r.subfamilia}
          </span>
        ) : (
          <span className="font-semibold text-gray-900">{r.familia}</span>
        ),
    },
    {
      name: 'Tipo',
      width: '140px',
      cell: (r) =>
        r.codfamilia.length === 6 ? (
          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">Subfamilia</span>
        ) : (
          <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-700">Familia</span>
        ),
    },
    {
      name: 'Acciones',
      width: '170px',
      cell: (r) => (
        <div className="flex gap-2">
          {r.codfamilia.length === 3 && (
            <IconButton icon={Plus} label="Agregar subfamilia" variant="success" size="sm" onClick={() => abrir({ padre: r.codfamilia })} />
          )}
          <IconButton icon={Edit} label="Editar" variant="warning" size="sm" onClick={() => abrir({ editar: r })} />
          <IconButton icon={Trash2} label="Eliminar" variant="danger" size="sm" onClick={() => eliminarFamilia(r)} />
        </div>
      ),
    },
  ];

  const vacio = (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <FolderTree className="h-10 w-10 text-gray-300" />
      {busqueda ? (
        <p className="text-gray-500">Nada coincide con “{busqueda}”.</p>
      ) : (
        <>
          <p className="text-gray-500">Aún no hay familias. Créalas para clasificar tus artículos.</p>
          <IconButton icon={Plus} label="Crear la primera" variant="primary" size="md" onClick={() => abrir()} />
        </>
      )}
    </div>
  );

  return (
    <MainLayout>
      <div className="w-full rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Familias</h1>
            <p className="text-sm text-gray-500 tabular-nums">
              {loading ? 'Cargando…' : `${padres.length} familia(s) · ${familias.length - padres.length} subfamilia(s)`}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                className="h-10 w-full rounded-lg border border-gray-300 pl-9 pr-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/40 sm:w-72"
                placeholder="Buscar familia o subfamilia"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <IconButton icon={Plus} label="Nueva familia" variant="primary" size="md" onClick={() => abrir()} />
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>
            <button type="button" className="font-semibold underline" onClick={fetchFamilias}>Reintentar</button>
          </div>
        )}

        <DataTable
          columns={columns}
          data={filas}
          customStyles={customStyles}
          progressPending={loading}
          progressComponent={
            <div className="w-full space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 animate-pulse rounded bg-gray-100" />)}
            </div>
          }
          noDataComponent={vacio}
          pagination
          paginationPerPage={50}
          paginationRowsPerPageOptions={[50, 100, 200]}
          fixedHeader
          fixedHeaderScrollHeight="65vh"
          highlightOnHover
        />

        <CreateModal
          isOpen={modal.abierto}
          onClose={cerrar}
          editar={modal.editar}
          padre={modal.padre}
          familias={padres}
          onGuardar={(datos) => (modal.editar ? actualizarFamilia(modal.editar.codfamilia, datos) : crearFamilia(datos))}
        />
      </div>
    </MainLayout>
  );
};

export default Familias;
