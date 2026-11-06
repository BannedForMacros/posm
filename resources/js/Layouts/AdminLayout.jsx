import React, { useEffect, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import FlashMessages from '@/Components/admin/FlashMessages';

const navigation = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard, exact: true },
  { label: 'Empresas', href: '/admin/empresas', icon: Building2 },
  { label: 'Usuarios', href: '/admin/usuarios', icon: Users },
  { label: 'Locales', href: '/admin/locales', icon: MapPin },
];

function initialCollapsed() {
  try {
    return JSON.parse(localStorage.getItem('adminSidebarCollapsed') ?? 'false');
  } catch {
    return false;
  }
}

export default function AdminLayout({ title = 'Administración', children }) {
  const page = usePage();
  const { auth, empresaActual } = page.props;
  const user = auth?.user;
  const currentPath = page.url.split('?')[0];

  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('adminSidebarCollapsed', JSON.stringify(collapsed));
  }, [collapsed]);

  useEffect(() => {
    setMobileOpen(false);
  }, [currentPath]);

  const initials = (user?.name ?? 'SA')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return (
    <div className="min-h-screen bg-slate-100">
      <Head title={`${title} · Administración`} />
      <FlashMessages />

      {mobileOpen && (
        <button
          type="button"
          aria-label="Cerrar menú"
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-slate-950 text-slate-300 transition-all duration-300',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0',
          collapsed ? 'lg:w-20' : 'lg:w-64',
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
          <Link href="/admin" className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-orange-600 font-bold text-white shadow-lg shadow-orange-950/30">
              P
            </span>
            <span className={cn('min-w-0', collapsed && 'lg:hidden')}>
              <span className="block text-sm font-semibold tracking-wide text-white">POS.M</span>
              <span className="block text-[11px] uppercase tracking-[0.18em] text-slate-500">
                Administración
              </span>
            </span>
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white lg:hidden"
            aria-label="Cerrar menú"
          >
            <X size={18} />
          </button>

          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            className="hidden rounded-lg p-1.5 text-slate-500 hover:bg-white/5 hover:text-white lg:block"
            aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          >
            {collapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
          <p
            className={cn(
              'px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600',
              collapsed && 'lg:hidden',
            )}
          >
            Gestión global
          </p>

          {navigation.map((item) => {
            const Icon = item.icon;
            const active = item.exact
              ? currentPath === item.href
              : currentPath.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                  active
                    ? 'bg-orange-600 text-white shadow-lg shadow-orange-950/20'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white',
                  collapsed && 'lg:justify-center lg:px-2',
                )}
              >
                <Icon size={19} className="shrink-0" />
                <span className={cn('truncate', collapsed && 'lg:hidden')}>{item.label}</span>
              </Link>
            );
          })}

          <div className="pt-5">
            <p
              className={cn(
                'px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600',
                collapsed && 'lg:hidden',
              )}
            >
              Operación
            </p>

            {empresaActual ? (
              <Link
                href="/dashboard"
                title={collapsed ? 'Ir al POS' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-white/5 hover:text-white',
                  collapsed && 'lg:justify-center lg:px-2',
                )}
              >
                <ExternalLink size={19} className="shrink-0" />
                <span className={cn('truncate', collapsed && 'lg:hidden')}>Ir al POS</span>
              </Link>
            ) : (
              <p
                className={cn(
                  'rounded-xl border border-dashed border-white/10 px-3 py-3 text-xs leading-5 text-slate-500',
                  collapsed && 'lg:hidden',
                )}
              >
                Entra a una empresa para operar en el POS.
              </p>
            )}

            <Link
              href="/profile"
              title={collapsed ? 'Mi perfil' : undefined}
              className={cn(
                'mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-white/5 hover:text-white',
                collapsed && 'lg:justify-center lg:px-2',
              )}
            >
              <ShieldCheck size={19} className="shrink-0" />
              <span className={cn('truncate', collapsed && 'lg:hidden')}>Mi perfil</span>
            </Link>
          </div>
        </nav>

        <div className="border-t border-white/10 p-3">
          <div
            className={cn(
              'flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5',
              collapsed && 'lg:justify-center lg:px-2',
            )}
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-orange-500/15 text-xs font-semibold text-orange-300">
              {initials}
            </span>
            <div className={cn('min-w-0 flex-1', collapsed && 'lg:hidden')}>
              <p className="truncate text-sm font-medium text-white">{user?.name}</p>
              <p className="truncate text-xs text-slate-500">Superadministrador</p>
            </div>
            <button
              type="button"
              onClick={() => router.post('/logout')}
              title="Cerrar sesión"
              className={cn(
                'rounded-lg p-1.5 text-slate-500 transition hover:bg-white/5 hover:text-white',
                collapsed && 'lg:hidden',
              )}
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>

      <div
        className={cn(
          'min-h-screen transition-all duration-300',
          collapsed ? 'lg:pl-20' : 'lg:pl-64',
        )}
      >
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 lg:hidden"
                aria-label="Abrir menú"
              >
                <Menu size={20} />
              </button>

              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
                  Administración
                </p>
                <p className="truncate text-sm font-semibold text-slate-800">{title}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {empresaActual && (
                <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 sm:flex">
                  <Building2 size={14} className="text-orange-500" />
                  <span className="max-w-[160px] truncate font-medium">{empresaActual.nombre}</span>
                  <button
                    type="button"
                    onClick={() => router.delete('/empresa-activa')}
                    className="ml-1 rounded-full p-0.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                    title="Salir del contexto de la empresa"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}

              <span className="hidden items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-700 ring-1 ring-inset ring-violet-600/20 sm:inline-flex">
                <ShieldCheck size={14} />
                Superadmin
              </span>

              <Link
                href="/admin"
                className="grid h-9 w-9 place-items-center rounded-full bg-slate-900 text-xs font-semibold text-white"
                title={user?.name}
              >
                {initials}
              </Link>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
