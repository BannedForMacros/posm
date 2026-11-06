import React, { useState } from 'react';
import { Link, router, useForm } from '@inertiajs/react';
import {
  ArrowLeft,
  Building2,
  Calendar,
  Mail,
  MapPin,
  MapPinned,
  Package,
  Pencil,
  Phone,
  Plus,
  Power,
  Receipt,
  ShieldCheck,
  ShoppingCart,
  Trash2,
  Truck,
  UserPlus,
  Users,
} from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import StatCard from '@/Components/admin/StatCard';
import Dialog from '@/Components/admin/Dialog';
import ConfirmDialog from '@/Components/admin/ConfirmDialog';
import {
  DataTable,
  RoleBadge,
  StatusBadge,
} from '@/Components/admin/TableTools';
import { Field, Select } from '@/Components/admin/FormControls';
import { Button } from '@/Components/ui/Button';
import EmpresaFormModal from './components/EmpresaFormModal';
import LocalFormModal from '@/Pages/Admin/Locales/components/LocalFormModal';

const tabs = [
  { key: 'resumen', label: 'Resumen' },
  { key: 'usuarios', label: 'Usuarios' },
  { key: 'locales', label: 'Locales' },
];

export default function EmpresaShow({
  empresa,
  usuarios,
  usuariosDisponibles,
  locales,
  stats,
}) {
  const [tab, setTab] = useState('resumen');
  const [editOpen, setEditOpen] = useState(false);
  const [localOpen, setLocalOpen] = useState(false);
  const [localEditing, setLocalEditing] = useState(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [userToRemove, setUserToRemove] = useState(null);

  const assignForm = useForm({ user_id: '', rol: 'operador' });

  const openLocal = (local = null) => {
    setLocalEditing(local);
    setLocalOpen(true);
  };

  const openAssign = () => {
    assignForm.reset();
    assignForm.clearErrors();
    setAssignOpen(true);
  };

  const submitAssign = (event) => {
    event.preventDefault();
    assignForm.post(`/admin/empresas/${empresa.id}/usuarios`, {
      preserveScroll: true,
      onSuccess: () => {
        setAssignOpen(false);
        assignForm.reset();
      },
    });
  };

  const removeUser = () => {
    if (!userToRemove) return;

    router.delete(`/admin/empresas/${empresa.id}/usuarios/${userToRemove.id}`, {
      preserveScroll: true,
      onSuccess: () => setUserToRemove(null),
    });
  };

  const toggleEmpresa = () => {
    router.patch(`/admin/empresas/${empresa.id}/estado`, {}, { preserveScroll: true });
  };

  const enterEmpresa = () => {
    router.post(`/empresa-activa/${empresa.id}`, { destino: 'dashboard' });
  };

  const toggleLocal = (local) => {
    router.patch(`/admin/locales/${local.id}/estado`, {}, { preserveScroll: true });
  };

  const userColumns = [
    {
      key: 'usuario',
      header: 'Usuario',
      render: (usuario) => (
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-900 text-xs font-semibold text-white">
            {usuario.name
              .split(' ')
              .filter(Boolean)
              .slice(0, 2)
              .map((part) => part[0])
              .join('')
              .toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium text-slate-800">{usuario.name}</p>
            <p className="truncate text-xs text-slate-500">{usuario.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'rol',
      header: 'Rol en la empresa',
      render: (usuario) => <RoleBadge rol={usuario.rol} />,
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (usuario) => (
        <div className="flex flex-wrap gap-2">
          <StatusBadge active={usuario.activo} />
          {!usuario.membresia_activa && (
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
              Membresía inactiva
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'acciones',
      header: '',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (usuario) => (
        <button
          type="button"
          onClick={() => setUserToRemove(usuario)}
          title="Retirar de la empresa"
          className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 size={16} />
        </button>
      ),
    },
  ];

  const localColumns = [
    {
      key: 'local',
      header: 'Local',
      render: (local) => (
        <div>
          <p className="font-medium text-slate-800">{local.nombre}</p>
          <p className="text-xs text-slate-500">{local.direccion || 'Sin dirección'}</p>
        </div>
      ),
    },
    {
      key: 'created_at',
      header: 'Creado',
      render: (local) => <span className="text-sm text-slate-500">{local.created_at}</span>,
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (local) => <StatusBadge active={local.estado} />,
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
            onClick={() => openLocal(local)}
            title="Editar local"
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-orange-600"
          >
            <Pencil size={16} />
          </button>
          <button
            type="button"
            onClick={() => toggleLocal(local)}
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
    <AdminLayout title="Detalle de empresa">
      <div className="space-y-6">
        <Link
          href="/admin/empresas"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-orange-600"
        >
          <ArrowLeft size={16} />
          Volver a empresas
        </Link>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="h-2 bg-gradient-to-r from-orange-500 via-orange-400 to-amber-300" />
          <div className="p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-4">
                <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-orange-50 text-2xl font-bold text-orange-600">
                  {empresa.nombre?.[0]?.toUpperCase() ?? 'E'}
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                      {empresa.nombre}
                    </h1>
                    <StatusBadge active={empresa.estado} />
                  </div>
                  <p className="mt-1 text-sm text-slate-500">RUC {empresa.ruc}</p>
                  {empresa.nombre_comercial && (
                    <p className="text-sm text-slate-500">{empresa.nombre_comercial}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" icon={Pencil} onClick={() => setEditOpen(true)}>
                  Editar
                </Button>
                <Button variant="outline" icon={Power} onClick={toggleEmpresa}>
                  {empresa.estado ? 'Desactivar' : 'Activar'}
                </Button>
                <Button icon={MapPinned} onClick={enterEmpresa} disabled={!empresa.estado}>
                  Entrar al POS
                </Button>
              </div>
            </div>

            <div className="mt-6 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-center gap-2 text-slate-600">
                <Mail size={16} className="text-slate-400" />
                <span className="truncate">{empresa.email || 'Sin correo'}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Phone size={16} className="text-slate-400" />
                <span>{empresa.telefono || 'Sin teléfono'}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <MapPin size={16} className="text-slate-400" />
                <span className="truncate">{empresa.direccion || 'Sin dirección'}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Calendar size={16} className="text-slate-400" />
                <span>Creada el {empresa.created_at}</span>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Artículos" value={stats.articulos} icon={Package} accent="orange" />
          <StatCard title="Ventas" value={stats.ventas} icon={ShoppingCart} accent="emerald" />
          <StatCard title="Compras" value={stats.compras} icon={Receipt} accent="sky" />
          <StatCard title="Proveedores" value={stats.proveedores} icon={Truck} accent="violet" />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex gap-1 overflow-x-auto border-b border-slate-100 px-4 pt-3">
            {tabs.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setTab(item.key)}
                className={`whitespace-nowrap rounded-t-lg px-4 py-2.5 text-sm font-medium transition ${
                  tab === item.key
                    ? 'border-b-2 border-orange-500 text-orange-600'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {item.label}
                {item.key === 'usuarios' && (
                  <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">
                    {usuarios.length}
                  </span>
                )}
                {item.key === 'locales' && (
                  <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">
                    {locales.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="p-4 sm:p-5">
            {tab === 'resumen' && (
              <div className="grid gap-5 lg:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 lg:col-span-2">
                  <h3 className="text-sm font-semibold text-slate-800">Información de la empresa</h3>
                  <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Razón social
                      </dt>
                      <dd className="mt-1 text-sm text-slate-700">{empresa.razon_social}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Nombre comercial
                      </dt>
                      <dd className="mt-1 text-sm text-slate-700">
                        {empresa.nombre_comercial || '—'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        RUC
                      </dt>
                      <dd className="mt-1 text-sm text-slate-700">{empresa.ruc}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Estado
                      </dt>
                      <dd className="mt-1">
                        <StatusBadge active={empresa.estado} />
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Dirección
                      </dt>
                      <dd className="mt-1 text-sm text-slate-700">
                        {empresa.direccion || '—'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Correo
                      </dt>
                      <dd className="mt-1 text-sm text-slate-700">{empresa.email || '—'}</dd>
                    </div>
                  </dl>
                </div>

                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-5">
                  <span className="inline-flex rounded-xl bg-orange-50 p-2.5 text-orange-600">
                    <ShieldCheck size={20} />
                  </span>
                  <h3 className="mt-3 text-sm font-semibold text-slate-800">Cómo funciona</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Asigna usuarios con rol <strong>Administrador</strong> u{' '}
                    <strong>Operador</strong>. Los usuarios con varias empresas verán un selector
                    de empresa al ingresar al POS.
                  </p>
                </div>
              </div>
            )}

            {tab === 'usuarios' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-slate-500">
                    {usuarios.length} usuario{usuarios.length === 1 ? '' : 's'} con acceso a esta
                    empresa.
                  </p>
                  <Button icon={UserPlus} size="sm" onClick={openAssign}>
                    Asignar usuario
                  </Button>
                </div>

                <DataTable
                  columns={userColumns}
                  rows={usuarios}
                  emptyIcon={Users}
                  emptyTitle="Sin usuarios asignados"
                  emptyDescription="Asigna el primer usuario para que pueda operar con esta empresa."
                />
              </div>
            )}

            {tab === 'locales' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-slate-500">
                    {locales.length} local{locales.length === 1 ? '' : 'es'} registrado
                    {locales.length === 1 ? '' : 's'}.
                  </p>
                  <Button icon={Plus} size="sm" onClick={() => openLocal(null)}>
                    Nuevo local
                  </Button>
                </div>

                <DataTable
                  columns={localColumns}
                  rows={locales}
                  emptyIcon={Building2}
                  emptyTitle="Sin locales"
                  emptyDescription="Crea el primer local o sucursal de esta empresa."
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <EmpresaFormModal open={editOpen} onClose={() => setEditOpen(false)} empresa={empresa} />

      <LocalFormModal
        open={localOpen}
        onClose={() => setLocalOpen(false)}
        local={localEditing}
        empresas={[{ id: empresa.id, nombre: empresa.nombre, ruc: empresa.ruc }]}
        defaultEmpresaId={empresa.id}
      />

      <Dialog
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        title="Asignar usuario a la empresa"
        description="El usuario podrá seleccionar esta empresa desde el POS."
        footer={
          <>
            <Button variant="secondary" onClick={() => setAssignOpen(false)} disabled={assignForm.processing}>
              Cancelar
            </Button>
            <Button type="submit" form="assign-user-form" isLoading={assignForm.processing}>
              Asignar
            </Button>
          </>
        }
      >
        <form id="assign-user-form" onSubmit={submitAssign} className="space-y-4">
          <Field label="Usuario" htmlFor="assign-user" error={assignForm.errors.user_id} required>
            <Select
              id="assign-user"
              value={assignForm.data.user_id}
              onChange={(event) => assignForm.setData('user_id', event.target.value)}
              error={assignForm.errors.user_id}
            >
              <option value="">Selecciona un usuario</option>
              {usuariosDisponibles.map((usuario) => (
                <option key={usuario.id} value={usuario.id}>
                  {usuario.name} · {usuario.email}
                </option>
              ))}
            </Select>
          </Field>

          {usuariosDisponibles.length === 0 && (
            <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-500">
              Todos los usuarios existentes ya están asignados. Crea un usuario nuevo desde la
              sección Usuarios.
            </p>
          )}

          <Field label="Rol" htmlFor="assign-role" error={assignForm.errors.rol} required>
            <Select
              id="assign-role"
              value={assignForm.data.rol}
              onChange={(event) => assignForm.setData('rol', event.target.value)}
              error={assignForm.errors.rol}
            >
              <option value="operador">Operador</option>
              <option value="admin">Administrador</option>
            </Select>
          </Field>
        </form>
      </Dialog>

      <ConfirmDialog
        open={Boolean(userToRemove)}
        onClose={() => setUserToRemove(null)}
        onConfirm={removeUser}
        title="Retirar usuario de la empresa"
        message={`¿Retirar a ${userToRemove?.name ?? 'este usuario'} de ${empresa.nombre}? La cuenta seguirá existiendo y conservará sus otras empresas.`}
        confirmLabel="Retirar"
      />
    </AdminLayout>
  );
}
