import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
  ArrowRight,
  Building2,
  LogOut,
  Mail,
  ShieldCheck,
  Store,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SinEmpresa() {
  const { auth } = usePage().props;
  const user = auth?.user;
  const empresas = auth?.empresas ?? [];
  const [seleccionando, setSeleccionando] = useState(null);

  const entrarA = (empresa) => {
    setSeleccionando(empresa.id);
    router.post(`/empresa-activa/${empresa.id}`, {}, {
      preserveScroll: true,
      onFinish: () => setSeleccionando(null),
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <Head title="Sin empresa asignada" />

      <div className="w-full max-w-lg">
        <div className="mb-6 flex items-center justify-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-orange-600 text-lg font-bold text-white shadow-lg shadow-orange-950/20">
            P
          </span>
          <div>
            <p className="text-sm font-semibold tracking-wide text-slate-900">POS.M</p>
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
              Punto de venta
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5">
          <div className="border-b border-slate-100 px-6 py-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
              <Store size={14} />
              Sin empresa activa
            </span>

            <h1 className="mt-4 text-xl font-semibold text-slate-900">
              Hola{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Tu cuenta todavía no está vinculada a ninguna empresa. Pide a un
              administrador que te agregue a una empresa para poder operar en el
              punto de venta.
            </p>
          </div>

          {empresas.length > 0 && (
            <div className="border-b border-slate-100 px-6 py-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Empresas disponibles
              </p>
              <div className="mt-3 space-y-2">
                {empresas.map((empresa) => (
                  <button
                    key={empresa.id}
                    type="button"
                    onClick={() => entrarA(empresa)}
                    disabled={seleccionando !== null}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-left transition',
                      'hover:border-orange-300 hover:bg-orange-50/60 disabled:cursor-wait disabled:opacity-60',
                    )}
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500">
                      <Building2 size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-slate-800">
                        {empresa.nombre}
                      </span>
                      <span className="block truncate text-xs text-slate-500">
                        RUC {empresa.ruc}
                      </span>
                    </span>
                    <ArrowRight size={16} className="shrink-0 text-slate-400" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3 px-6 py-5">
            {user?.is_superadmin && (
              <Link
                href="/admin"
                className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                <ShieldCheck size={16} />
                Ir al panel de administración
              </Link>
            )}

            <button
              type="button"
              onClick={() => router.post('/logout')}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-800"
            >
              <LogOut size={16} />
              Cerrar sesión
            </button>

            <p className="flex items-center justify-center gap-1.5 pt-1 text-xs text-slate-400">
              <Mail size={13} />
              {user?.email}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
