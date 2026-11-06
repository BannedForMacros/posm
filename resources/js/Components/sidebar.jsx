import React, { useEffect, useRef, useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import {
  Boxes,
  Building,
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Factory,
  FileText,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Monitor,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Store,
  Users,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const MENUS_STORAGE_KEY = 'sidebarOpenMenus';

const NAV_ITEMS = [
  {
    type: 'link',
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    type: 'submenu',
    key: 'mantenimiento',
    label: 'Mantenimiento',
    icon: Monitor,
    items: [
      { label: 'Artículos (CRUD)', href: '/articulos-manage', icon: Boxes },
      { label: 'Familias', href: '/familias', icon: FolderTree },
      { label: 'Proveedores', href: '/proveedores', icon: Users },
      { label: 'Sucursales', href: '/sucursales', icon: Building2 },
      { label: 'Almacenes', href: '/almacenes', icon: Building },
    ],
  },
  {
    type: 'link',
    label: 'Compras',
    href: '/facturacion',
    icon: FileText,
  },
  {
    type: 'link',
    label: 'Ventas',
    href: '/ventas',
    icon: ShoppingCart,
  },
  {
    type: 'link',
    label: 'Lista de Precios',
    href: '/lista-precios',
    icon: ClipboardList,
  },
  {
    type: 'submenu',
    key: 'inventario',
    label: 'Inventario',
    icon: Package,
    items: [
      { label: 'Inventario Inicial', href: '/inventario-inicial', icon: Package },
      { label: 'Stock Inventario', href: '/inventario', icon: Factory },
      { label: 'Docs. de Almacén', href: '/warehouse-documents', icon: FileText },
      { label: 'Movimientos Almacén', href: '/warehouse-movements', icon: Boxes },
    ],
  },
  {
    type: 'link',
    label: 'Mi perfil',
    href: '/profile',
    icon: Settings,
  },
];

function loadOpenMenus() {
  try {
    const stored = localStorage.getItem(MENUS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function initialsOf(name) {
  return (name ?? 'U')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function isPathActive(currentPath, href) {
  return currentPath === href || currentPath.startsWith(`${href}/`);
}

export default function Sidebar({
  collapsed = false,
  onToggleCollapse,
  mobileOpen = false,
  onCloseMobile,
}) {
  const page = usePage();
  const { auth, empresaActual } = page.props;
  const user = auth?.user;
  const empresas = auth?.empresas ?? [];
  const currentPath = page.url.split('?')[0];

  const [openMenus, setOpenMenus] = useState(loadOpenMenus);
  const [empresaMenuOpen, setEmpresaMenuOpen] = useState(false);
  const empresaMenuRef = useRef(null);

  const puedeCambiarEmpresa = user?.is_superadmin || empresas.length > 1;

  useEffect(() => {
    localStorage.setItem(MENUS_STORAGE_KEY, JSON.stringify(openMenus));
  }, [openMenus]);

  // Abre automáticamente el submenú que contiene la ruta actual.
  useEffect(() => {
    const parent = NAV_ITEMS.find(
      (item) =>
        item.type === 'submenu' &&
        item.items.some((subitem) => isPathActive(currentPath, subitem.href)),
    );

    if (parent) {
      setOpenMenus((prev) =>
        prev[parent.key] ? prev : { ...prev, [parent.key]: true },
      );
    }
  }, [currentPath]);

  useEffect(() => {
    if (!empresaMenuOpen) return undefined;

    const handleClick = (event) => {
      if (!empresaMenuRef.current?.contains(event.target)) {
        setEmpresaMenuOpen(false);
      }
    };
    const handleEscape = (event) => {
      if (event.key === 'Escape') setEmpresaMenuOpen(false);
    };

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [empresaMenuOpen]);

  useEffect(() => {
    if (collapsed) setEmpresaMenuOpen(false);
  }, [collapsed]);

  const toggleSubmenu = (key) => {
    setOpenMenus((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const cambiarEmpresa = (empresa) => {
    setEmpresaMenuOpen(false);
    onCloseMobile?.();

    if (empresa.id === empresaActual?.id) return;

    router.post(`/empresa-activa/${empresa.id}`, {}, { preserveScroll: true });
  };

  const salirDeEmpresa = () => {
    setEmpresaMenuOpen(false);
    router.delete('/empresa-activa');
  };

  const linkClass = (active, extra = '') =>
    cn(
      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
      active
        ? 'bg-orange-600 text-white shadow-lg shadow-orange-950/20'
        : 'text-slate-400 hover:bg-white/5 hover:text-white',
      collapsed && 'lg:justify-center lg:px-2',
      extra,
    );

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-slate-950 text-slate-300 transition-all duration-300',
        mobileOpen ? 'translate-x-0' : '-translate-x-full',
        'lg:translate-x-0',
        collapsed ? 'lg:w-20' : 'lg:w-64',
      )}
      aria-label="Navegación principal"
    >
      {/* Encabezado */}
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
        <Link
          href="/dashboard"
          onClick={onCloseMobile}
          className="flex min-w-0 items-center gap-3"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-orange-600 font-bold text-white shadow-lg shadow-orange-950/30">
            P
          </span>
          <span className={cn('min-w-0', collapsed && 'lg:hidden')}>
            <span className="block text-sm font-semibold tracking-wide text-white">
              POS.M
            </span>
            <span className="block text-[11px] uppercase tracking-[0.18em] text-slate-500">
              Punto de venta
            </span>
          </span>
        </Link>

        <button
          type="button"
          onClick={onCloseMobile}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white lg:hidden"
          aria-label="Cerrar menú"
        >
          <X size={18} />
        </button>

        <button
          type="button"
          onClick={onToggleCollapse}
          className="hidden rounded-lg p-1.5 text-slate-500 hover:bg-white/5 hover:text-white lg:block"
          aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
        >
          {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
        </button>
      </div>

      {/* Selector de empresa */}
      <div className={cn('px-3 py-3', collapsed && 'lg:px-2')}>
        {collapsed ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            title={empresaActual?.nombre ?? 'Sin empresa activa'}
            className="hidden w-full place-items-center rounded-xl border border-white/10 bg-white/5 p-2.5 text-orange-300 transition hover:bg-white/10 lg:grid"
          >
            <Building2 size={18} />
          </button>
        ) : null}

        <div
          ref={empresaMenuRef}
          className={cn('relative', collapsed && 'lg:hidden')}
        >
          <button
            type="button"
            onClick={() => puedeCambiarEmpresa && setEmpresaMenuOpen((v) => !v)}
            className={cn(
              'flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-left transition',
              puedeCambiarEmpresa
                ? 'hover:border-white/20 hover:bg-white/10'
                : 'cursor-default',
            )}
            aria-haspopup={puedeCambiarEmpresa ? 'menu' : undefined}
            aria-expanded={empresaMenuOpen}
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-orange-500/15 text-orange-300">
              {empresaActual ? <Store size={16} /> : <Building2 size={16} />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Empresa activa
              </span>
              <span className="block truncate text-sm font-medium text-white">
                {empresaActual?.nombre ?? 'Sin empresa'}
              </span>
            </span>
            {puedeCambiarEmpresa && (
              <ChevronDown
                size={15}
                className={cn(
                  'shrink-0 text-slate-500 transition-transform',
                  empresaMenuOpen && 'rotate-180',
                )}
              />
            )}
          </button>

          {empresaMenuOpen && puedeCambiarEmpresa && (
            <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-white/10 bg-slate-900 p-1.5 shadow-2xl shadow-slate-950/60">
              <p className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Cambiar de empresa
              </p>

              <div className="max-h-60 space-y-0.5 overflow-y-auto">
                {empresas.map((empresa) => {
                  const activa = empresa.id === empresaActual?.id;

                  return (
                    <button
                      key={empresa.id}
                      type="button"
                      onClick={() => cambiarEmpresa(empresa)}
                      className={cn(
                        'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition',
                        activa
                          ? 'bg-orange-600/15 text-orange-200'
                          : 'text-slate-300 hover:bg-white/5 hover:text-white',
                      )}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">
                          {empresa.nombre}
                        </span>
                        <span className="block truncate text-[11px] text-slate-500">
                          RUC {empresa.ruc}
                          {empresa.rol ? ` · ${empresa.rol}` : ''}
                        </span>
                      </span>
                      {activa && <Check size={14} className="shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {empresaActual && (
                <button
                  type="button"
                  onClick={salirDeEmpresa}
                  className="mt-1 flex w-full items-center gap-2.5 rounded-lg border-t border-white/10 px-2.5 py-2 text-left text-xs text-slate-400 transition hover:bg-white/5 hover:text-white"
                >
                  <LogOut size={14} />
                  Salir del contexto de la empresa
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="h-px bg-white/10" />

      {/* Navegación */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <p
          className={cn(
            'px-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600',
            collapsed && 'lg:hidden',
          )}
        >
          Operación
        </p>

        {NAV_ITEMS.map((item) => {
          if (item.type === 'submenu') {
            const Icon = item.icon;
            const open = Boolean(openMenus[item.key]);
            const active = item.items.some((subitem) =>
              isPathActive(currentPath, subitem.href),
            );

            return (
              <div key={item.key} className="space-y-1">
                <button
                  type="button"
                  onClick={() => toggleSubmenu(item.key)}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    'flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                    active && !open
                      ? 'bg-white/5 text-white'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white',
                    collapsed && 'lg:justify-center lg:px-2',
                  )}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <Icon size={19} className="shrink-0" />
                    <span className={cn('truncate', collapsed && 'lg:hidden')}>
                      {item.label}
                    </span>
                  </span>
                  {!collapsed && (
                    <ChevronRight
                      size={15}
                      className={cn(
                        'shrink-0 text-slate-500 transition-transform',
                        open && 'rotate-90',
                      )}
                    />
                  )}
                </button>

                {open && (
                  <div
                    className={cn(
                      'ml-3 space-y-1 border-l border-white/10 pl-2',
                      collapsed && 'lg:hidden',
                    )}
                  >
                    {item.items.map((subitem) => {
                      const SubIcon = subitem.icon;

                      return (
                        <Link
                          key={subitem.href}
                          href={subitem.href}
                          onClick={onCloseMobile}
                          className={cn(
                            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition',
                            isPathActive(currentPath, subitem.href)
                              ? 'bg-orange-600 text-white'
                              : 'text-slate-400 hover:bg-white/5 hover:text-white',
                          )}
                        >
                          <SubIcon size={16} className="shrink-0" />
                          <span className="truncate">{subitem.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              title={collapsed ? item.label : undefined}
              className={linkClass(
                isPathActive(currentPath, item.href),
                'justify-start',
              )}
            >
              <Icon size={19} className="shrink-0" />
              <span className={cn('truncate', collapsed && 'lg:hidden')}>
                {item.label}
              </span>
            </Link>
          );
        })}

        {user?.is_superadmin && (
          <div className="pt-4">
            <p
              className={cn(
                'px-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600',
                collapsed && 'lg:hidden',
              )}
            >
              Administración
            </p>

            <Link
              href="/admin"
              onClick={onCloseMobile}
              title={collapsed ? 'Panel de administración' : undefined}
              className={linkClass(
                isPathActive(currentPath, '/admin'),
                'justify-start',
              )}
            >
              <ShieldCheck size={19} className="shrink-0" />
              <span className={cn('truncate', collapsed && 'lg:hidden')}>
                Panel de administración
              </span>
            </Link>
          </div>
        )}
      </nav>

      {/* Usuario / cerrar sesión */}
      <div className="border-t border-white/10 p-3">
        <div
          className={cn(
            'flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5',
            collapsed && 'lg:justify-center lg:px-2',
          )}
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-orange-500/15 text-xs font-semibold text-orange-300">
            {initialsOf(user?.name)}
          </span>
          <div className={cn('min-w-0 flex-1', collapsed && 'lg:hidden')}>
            <p className="truncate text-sm font-medium text-white">
              {user?.name}
            </p>
            <p className="truncate text-xs text-slate-500">
              {empresaActual?.rol === 'admin'
                ? 'Administrador'
                : empresaActual?.rol === 'operador'
                  ? 'Operador'
                  : user?.is_superadmin
                    ? 'Superadministrador'
                    : 'Sin rol'}
            </p>
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

        {collapsed && (
          <button
            type="button"
            onClick={() => router.post('/logout')}
            title="Cerrar sesión"
            className="mt-2 hidden w-full place-items-center rounded-lg p-2 text-slate-500 transition hover:bg-white/5 hover:text-white lg:grid"
          >
            <LogOut size={17} />
          </button>
        )}
      </div>
    </aside>
  );
}
