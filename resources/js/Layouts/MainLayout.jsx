import React, { useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { Building2, Menu } from 'lucide-react';
import Sidebar from '@/Components/sidebar';
import FlashMessages from '@/Components/admin/FlashMessages';
import { cn } from '@/lib/utils';

const COLLAPSED_STORAGE_KEY = 'sidebarCollapsed';

function loadCollapsed() {
  try {
    return JSON.parse(localStorage.getItem(COLLAPSED_STORAGE_KEY) ?? 'false');
  } catch {
    return false;
  }
}

export default function MainLayout({ children }) {
  const page = usePage();
  const { empresaActual } = page.props;
  const currentPath = page.url.split('?')[0];

  const [collapsed, setCollapsed] = useState(loadCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(COLLAPSED_STORAGE_KEY, JSON.stringify(collapsed));
  }, [collapsed]);

  // Cierra el menú móvil al navegar.
  useEffect(() => {
    setMobileOpen(false);
  }, [currentPath]);

  return (
    <div className="min-h-screen bg-slate-100">
      <FlashMessages />

      {mobileOpen && (
        <button
          type="button"
          aria-label="Cerrar menú"
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((value) => !value)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div
        className={cn(
          'flex min-h-screen flex-col transition-all duration-300',
          collapsed ? 'lg:pl-20' : 'lg:pl-64',
        )}
      >
        {/* Barra superior solo para móvil */}
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 backdrop-blur lg:hidden">
          <div className="flex h-14 items-center gap-3 px-4">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label="Abrir menú"
            >
              <Menu size={20} />
            </button>

            <span className="text-sm font-semibold tracking-wide text-slate-900">
              POS.M
            </span>

            {empresaActual && (
              <span className="ml-auto flex min-w-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600">
                <Building2 size={13} className="shrink-0 text-orange-500" />
                <span className="max-w-[140px] truncate font-medium">
                  {empresaActual.nombre}
                </span>
              </span>
            )}
          </div>
        </header>

        <main className="w-full flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
