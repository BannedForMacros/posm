import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
  ArrowUpRight,
  Building2,
  ChevronRight,
  Link2,
  MapPin,
  Plus,
  ShieldCheck,
  Users,
} from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import StatCard from '@/Components/admin/StatCard';
import PageHeader from '@/Components/admin/PageHeader';
import { RoleBadge, StatusBadge } from '@/Components/admin/TableTools';

export default function Dashboard({ stats, empresasRecientes, usuariosRecientes, topEmpresas }) {
  const { auth } = usePage().props;
  const user = auth?.user;
  const maxUsers = Math.max(...topEmpresas.map((empresa) => empresa.users_count), 1);

  return (
    <AdminLayout title="Dashboard">
      <div className="space-y-6">
        <section className="relative overflow-hidden rounded-3xl bg-slate-950 p-6 text-white shadow-xl sm:p-8">
          <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-orange-600/30 blur-3xl" />
          <div className="absolute -bottom-24 right-32 h-56 w-56 rounded-full bg-violet-600/20 blur-3xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-orange-200 ring-1 ring-inset ring-white/15">
                <ShieldCheck size={14} />
                Panel de superadministración
              </p>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
                Hola, {user?.name?.split(' ')[0] ?? 'administrador'}.
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-300 sm:text-base">
                Administra empresas, asigna usuarios a una o varias empresas y controla los
                locales desde un solo lugar.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/admin/empresas?nueva=1"
                className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-950/30 transition hover:bg-orange-500"
              >
                <Plus size={17} />
                Nueva empresa
              </Link>
              <Link
                href="/admin/usuarios?nuevo=1"
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-inset ring-white/15 transition hover:bg-white/15"
              >
                <Users size={17} />
                Nuevo usuario
              </Link>
            </div>
          </div>
        </section>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Empresas activas"
            value={stats.empresas_activas}
            description={`${stats.empresas} empresas registradas en total`}
            icon={Building2}
            accent="orange"
          />
          <StatCard
            title="Usuarios"
            value={stats.usuarios_activos}
            description={`${stats.usuarios} cuentas · ${stats.superadmins} superadmins`}
            icon={Users}
            accent="sky"
          />
          <StatCard
            title="Locales"
            value={stats.locales}
            description="Locales o sucursales de todas las empresas"
            icon={MapPin}
            accent="emerald"
          />
          <StatCard
            title="Membresías"
            value={stats.membresias}
            description="Asignaciones usuario ↔ empresa activas"
            icon={Link2}
            accent="violet"
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-5">
          <section className="xl:col-span-3">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Empresas recientes</h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Últimas empresas creadas en la plataforma
                  </p>
                </div>
                <Link
                  href="/admin/empresas"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 hover:text-orange-700"
                >
                  Ver todas <ChevronRight size={14} />
                </Link>
              </div>

              <div className="divide-y divide-slate-100">
                {empresasRecientes.length === 0 && (
                  <p className="px-5 py-8 text-center text-sm text-slate-500">
                    Aún no hay empresas registradas.
                  </p>
                )}

                {empresasRecientes.map((empresa) => (
                  <Link
                    key={empresa.id}
                    href={`/admin/empresas/${empresa.id}`}
                    className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-slate-50"
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-orange-50 text-sm font-bold text-orange-600">
                      {empresa.nombre?.[0]?.toUpperCase() ?? 'E'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-800">
                        {empresa.nombre}
                      </p>
                      <p className="truncate text-xs text-slate-500">RUC {empresa.ruc}</p>
                    </div>
                    <div className="hidden items-center gap-4 text-xs text-slate-500 sm:flex">
                      <span>{empresa.users_count} usuarios</span>
                      <span>{empresa.sucursales_count} locales</span>
                    </div>
                    <StatusBadge active={empresa.estado} />
                    <ArrowUpRight size={16} className="text-slate-300" />
                  </Link>
                ))}
              </div>
            </div>
          </section>

          <section className="xl:col-span-2">
            <div className="h-full rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Usuarios recientes</h3>
                  <p className="mt-0.5 text-xs text-slate-500">Nuevas cuentas creadas</p>
                </div>
                <Link
                  href="/admin/usuarios"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 hover:text-orange-700"
                >
                  Ver todos <ChevronRight size={14} />
                </Link>
              </div>

              <div className="divide-y divide-slate-100">
                {usuariosRecientes.length === 0 && (
                  <p className="px-5 py-8 text-center text-sm text-slate-500">
                    Aún no hay usuarios registrados.
                  </p>
                )}

                {usuariosRecientes.map((usuario) => (
                  <div key={usuario.id} className="flex items-center gap-3 px-5 py-3.5">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                      {usuario.name
                        .split(' ')
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((part) => part[0])
                        .join('')
                        .toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-800">{usuario.name}</p>
                      <p className="truncate text-xs text-slate-500">{usuario.email}</p>
                    </div>
                    {usuario.is_superadmin ? (
                      <RoleBadge rol="superadmin" />
                    ) : (
                      <span className="text-xs text-slate-400">
                        {usuario.empresas.length} empresa{usuario.empresas.length === 1 ? '' : 's'}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <PageHeader
            title="Empresas con más usuarios"
            description="Distribución de membresías por empresa"
          />

          <div className="mt-5 space-y-4">
            {topEmpresas.length === 0 && (
              <p className="text-sm text-slate-500">Sin datos para mostrar.</p>
            )}

            {topEmpresas.map((empresa) => (
              <div key={empresa.id} className="flex items-center gap-4">
                <span className="w-40 truncate text-sm text-slate-600">{empresa.nombre}</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-orange-500 transition-all"
                    style={{ width: `${Math.max((empresa.users_count / maxUsers) * 100, 4)}%` }}
                  />
                </div>
                <span className="w-8 text-right text-sm font-semibold text-slate-700">
                  {empresa.users_count}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}
