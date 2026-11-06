import React, { useEffect, useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { Building2, Eye, LogIn, Pencil, Plus, Users } from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import PageHeader from '@/Components/admin/PageHeader';
import EmpresaFormModal from './components/EmpresaFormModal';
import {
  DataTable,
  Pagination,
  SearchInput,
  StatusBadge,
} from '@/Components/admin/TableTools';
import { Select } from '@/Components/admin/FormControls';
import { Button } from '@/Components/ui/Button';

export default function EmpresasIndex({ empresas, filters }) {
  const [search, setSearch] = useState(filters.search ?? '');
  const [estado, setEstado] = useState(filters.estado ?? 'todas');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search === (filters.search ?? '') && estado === (filters.estado ?? 'todas')) {
        return;
      }

      router.get(
        '/admin/empresas',
        { search, estado },
        { preserveState: true, replace: true, preserveScroll: true },
      );
    }, 350);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, estado]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('nueva') === '1') {
      setEditing(null);
      setModalOpen(true);
    }
  }, []);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (empresa) => {
    setEditing(empresa);
    setModalOpen(true);
  };

  const enterEmpresa = (empresa) => {
    router.post(`/empresa-activa/${empresa.id}`, { destino: 'dashboard' });
  };

  const columns = [
    {
      key: 'empresa',
      header: 'Empresa',
      render: (empresa) => (
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-orange-50 text-sm font-bold text-orange-600">
            {empresa.nombre?.[0]?.toUpperCase() ?? 'E'}
          </span>
          <div className="min-w-0">
            <Link
              href={`/admin/empresas/${empresa.id}`}
              className="block truncate font-medium text-slate-800 hover:text-orange-600"
            >
              {empresa.nombre}
            </Link>
            <p className="text-xs text-slate-500">RUC {empresa.ruc}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'contacto',
      header: 'Contacto',
      render: (empresa) => (
        <div className="text-sm">
          <p className="text-slate-600">{empresa.email || 'Sin correo'}</p>
          <p className="text-xs text-slate-400">{empresa.telefono || 'Sin teléfono'}</p>
        </div>
      ),
    },
    {
      key: 'users_count',
      header: 'Usuarios',
      render: (empresa) => (
        <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
          <Users size={15} className="text-slate-400" />
          {empresa.users_count}
        </span>
      ),
    },
    {
      key: 'sucursales_count',
      header: 'Locales',
      render: (empresa) => (
        <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
          <Building2 size={15} className="text-slate-400" />
          {empresa.sucursales_count}
        </span>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (empresa) => <StatusBadge active={empresa.estado} />,
    },
    {
      key: 'acciones',
      header: '',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (empresa) => (
        <div className="flex items-center justify-end gap-1">
          <Link
            href={`/admin/empresas/${empresa.id}`}
            title="Ver detalle"
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <Eye size={16} />
          </Link>
          <button
            type="button"
            onClick={() => openEdit(empresa)}
            title="Editar empresa"
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-orange-600"
          >
            <Pencil size={16} />
          </button>
          <button
            type="button"
            onClick={() => enterEmpresa(empresa)}
            title="Entrar al POS con esta empresa"
            disabled={!empresa.estado}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <LogIn size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <AdminLayout title="Empresas">
      <div className="space-y-5">
        <PageHeader
          title="Empresas"
          description="Administra las empresas (tenants), sus datos y el acceso de sus usuarios."
          actions={
            <Button icon={Plus} onClick={openCreate}>
              Nueva empresa
            </Button>
          }
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar por RUC, razón social o nombre..."
            className="w-full sm:max-w-md"
          />

          <div className="flex items-center gap-2">
            <Select
              value={estado}
              onChange={(event) => setEstado(event.target.value)}
              className="w-40"
            >
              <option value="todas">Todas</option>
              <option value="activas">Activas</option>
              <option value="inactivas">Inactivas</option>
            </Select>
          </div>
        </div>

        <DataTable
          columns={columns}
          rows={empresas.data}
          emptyIcon={Building2}
          emptyTitle="No hay empresas"
          emptyDescription="Crea la primera empresa para empezar a asignar usuarios y locales."
        />

        <Pagination paginator={empresas} />
      </div>

      <EmpresaFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        empresa={editing}
      />
    </AdminLayout>
  );
}
