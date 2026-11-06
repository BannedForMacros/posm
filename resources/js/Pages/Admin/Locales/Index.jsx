import React, { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import { Building2, MapPin, Pencil, Plus, Power } from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import PageHeader from '@/Components/admin/PageHeader';
import LocalFormModal from './components/LocalFormModal';
import {
  DataTable,
  Pagination,
  SearchInput,
  StatusBadge,
} from '@/Components/admin/TableTools';
import { Select } from '@/Components/admin/FormControls';
import { Button } from '@/Components/ui/Button';

export default function LocalesIndex({ locales, empresas, filters }) {
  const [search, setSearch] = useState(filters.search ?? '');
  const [empresaId, setEmpresaId] = useState(filters.empresa_id ?? '');
  const [estado, setEstado] = useState(filters.estado ?? 'todos');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (
        search === (filters.search ?? '') &&
        empresaId === (filters.empresa_id ?? '') &&
        estado === (filters.estado ?? 'todos')
      ) {
        return;
      }

      router.get(
        '/admin/locales',
        { search, empresa_id: empresaId, estado },
        { preserveState: true, replace: true, preserveScroll: true },
      );
    }, 350);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, empresaId, estado]);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (local) => {
    setEditing(local);
    setModalOpen(true);
  };

  const toggleEstado = (local) => {
    router.patch(`/admin/locales/${local.id}/estado`, {}, { preserveScroll: true });
  };

  const columns = [
    {
      key: 'local',
      header: 'Local',
      render: (local) => (
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
            <MapPin size={18} />
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium text-slate-800">{local.nombre}</p>
            <p className="truncate text-xs text-slate-500">
              {local.direccion || 'Sin dirección'}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'empresa',
      header: 'Empresa',
      render: (local) => (
        <div className="flex items-center gap-2">
          <Building2 size={15} className="shrink-0 text-slate-400" />
          <div className="min-w-0">
            <p className="truncate text-sm text-slate-700">{local.empresa_nombre ?? 'Sin empresa'}</p>
            <p className="text-xs text-slate-400">{local.empresa_ruc}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (local) => <StatusBadge active={local.estado} />,
    },
    {
      key: 'created_at',
      header: 'Creado',
      render: (local) => <span className="text-sm text-slate-500">{local.created_at}</span>,
    },
    {
      key: 'acciones',
      header: '',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (local) => (
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => openEdit(local)}
            title="Editar local"
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-orange-600"
          >
            <Pencil size={16} />
          </button>
          <button
            type="button"
            onClick={() => toggleEstado(local)}
            title={local.estado ? 'Desactivar local' : 'Activar local'}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <Power size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <AdminLayout title="Locales">
      <div className="space-y-5">
        <PageHeader
          title="Locales"
          description="Administra los locales o sucursales de todas las empresas."
          actions={
            <Button icon={Plus} onClick={openCreate}>
              Nuevo local
            </Button>
          }
        />

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar por nombre o dirección..."
            className="w-full lg:max-w-md"
          />

          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={empresaId}
              onChange={(event) => setEmpresaId(event.target.value)}
              className="w-56"
            >
              <option value="">Todas las empresas</option>
              {empresas.map((empresa) => (
                <option key={empresa.id} value={empresa.id}>
                  {empresa.nombre}
                </option>
              ))}
            </Select>
            <Select
              value={estado}
              onChange={(event) => setEstado(event.target.value)}
              className="w-36"
            >
              <option value="todos">Todos</option>
              <option value="activos">Activos</option>
              <option value="inactivos">Inactivos</option>
            </Select>
          </div>
        </div>

        <DataTable
          columns={columns}
          rows={locales.data}
          emptyIcon={MapPin}
          emptyTitle="No hay locales"
          emptyDescription="Crea el primer local y asígnalo a una empresa."
        />

        <Pagination paginator={locales} />
      </div>

      <LocalFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        local={editing}
        empresas={empresas}
      />
    </AdminLayout>
  );
}
