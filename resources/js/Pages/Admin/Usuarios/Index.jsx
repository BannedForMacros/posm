import React, { useEffect, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import {
  Building2,
  Pencil,
  Power,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import PageHeader from '@/Components/admin/PageHeader';
import ConfirmDialog from '@/Components/admin/ConfirmDialog';
import UsuarioFormModal from './components/UsuarioFormModal';
import {
  DataTable,
  Pagination,
  RoleBadge,
  SearchInput,
  StatusBadge,
} from '@/Components/admin/TableTools';
import { Select } from '@/Components/admin/FormControls';
import { Button } from '@/Components/ui/Button';

export default function UsuariosIndex({ usuarios, empresas, filters }) {
  const { auth } = usePage().props;
  const currentUserId = auth?.user?.id;

  const [search, setSearch] = useState(filters.search ?? '');
  const [rol, setRol] = useState(filters.rol ?? 'todos');
  const [estado, setEstado] = useState(filters.estado ?? 'todos');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (
        search === (filters.search ?? '') &&
        rol === (filters.rol ?? 'todos') &&
        estado === (filters.estado ?? 'todos')
      ) {
        return;
      }

      router.get(
        '/admin/usuarios',
        { search, rol, estado },
        { preserveState: true, replace: true, preserveScroll: true },
      );
    }, 350);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, rol, estado]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('nuevo') === '1') {
      setEditing(null);
      setModalOpen(true);
    }
  }, []);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (usuario) => {
    setEditing(usuario);
    setModalOpen(true);
  };

  const toggleEstado = (usuario) => {
    router.patch(`/admin/usuarios/${usuario.id}/estado`, {}, { preserveScroll: true });
  };

  const deleteUser = () => {
    if (!userToDelete) return;

    router.delete(`/admin/usuarios/${userToDelete.id}`, {
      preserveScroll: true,
      onSuccess: () => setUserToDelete(null),
    });
  };

  const columns = [
    {
      key: 'usuario',
      header: 'Usuario',
      render: (usuario) => (
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-900 text-xs font-semibold text-white">
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
      key: 'empresas',
      header: 'Empresas',
      render: (usuario) => {
        if (usuario.is_superadmin) {
          return (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700 ring-1 ring-inset ring-violet-600/20">
              <ShieldCheck size={13} />
              Acceso global
            </span>
          );
        }

        if (usuario.empresas.length === 0) {
          return <span className="text-xs text-slate-400">Sin empresa</span>;
        }

        return (
          <div className="flex max-w-xs flex-wrap gap-1">
            {usuario.empresas.slice(0, 2).map((empresa) => (
              <span
                key={empresa.id}
                className="inline-flex max-w-[150px] items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                title={`${empresa.nombre} · ${empresa.rol}`}
              >
                <Building2 size={11} className="shrink-0 text-slate-400" />
                <span className="truncate">{empresa.nombre}</span>
              </span>
            ))}
            {usuario.empresas.length > 2 && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                +{usuario.empresas.length - 2}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'rol',
      header: 'Rol',
      render: (usuario) =>
        usuario.is_superadmin ? <RoleBadge rol="superadmin" /> : <span className="text-sm text-slate-500">Usuario</span>,
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (usuario) => <StatusBadge active={usuario.activo} />,
    },
    {
      key: 'created_at',
      header: 'Creado',
      render: (usuario) => <span className="text-sm text-slate-500">{usuario.created_at}</span>,
    },
    {
      key: 'acciones',
      header: '',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (usuario) => {
        const isSelf = Number(usuario.id) === Number(currentUserId);

        return (
          <div className="flex items-center justify-end gap-1">
            <button
              type="button"
              onClick={() => openEdit(usuario)}
              title="Editar usuario"
              className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-orange-600"
            >
              <Pencil size={16} />
            </button>
            <button
              type="button"
              onClick={() => toggleEstado(usuario)}
              disabled={isSelf}
              title={usuario.activo ? 'Desactivar usuario' : 'Activar usuario'}
              className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <Power size={16} />
            </button>
            <button
              type="button"
              onClick={() => setUserToDelete(usuario)}
              disabled={isSelf}
              title="Eliminar usuario"
              className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <Trash2 size={16} />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <AdminLayout title="Usuarios">
      <div className="space-y-5">
        <PageHeader
          title="Usuarios"
          description="Crea cuentas y asígnalas a una o varias empresas con su rol correspondiente."
          actions={
            <Button icon={UserPlus} onClick={openCreate}>
              Nuevo usuario
            </Button>
          }
        />

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar por nombre o correo..."
            className="w-full lg:max-w-md"
          />

          <div className="flex flex-wrap items-center gap-2">
            <Select value={rol} onChange={(event) => setRol(event.target.value)} className="w-40">
              <option value="todos">Todos los roles</option>
              <option value="superadmin">Superadmins</option>
              <option value="usuario">Usuarios</option>
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
          rows={usuarios.data}
          emptyIcon={Users}
          emptyTitle="No hay usuarios"
          emptyDescription="Crea el primer usuario y asígnalo a una empresa."
        />

        <Pagination paginator={usuarios} />
      </div>

      <UsuarioFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        usuario={editing}
        empresas={empresas}
      />

      <ConfirmDialog
        open={Boolean(userToDelete)}
        onClose={() => setUserToDelete(null)}
        onConfirm={deleteUser}
        title="Eliminar usuario"
        message={`¿Eliminar la cuenta de ${userToDelete?.name ?? 'este usuario'}? Se quitarán todas sus membresías. Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
      />
    </AdminLayout>
  );
}
