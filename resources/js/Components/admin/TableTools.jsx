import React from 'react';
import { Link } from '@inertiajs/react';
import { Search, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SearchInput({ value, onChange, placeholder = 'Buscar...', className }) {
  return (
    <div className={cn('relative', className)}>
      <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
      />
    </div>
  );
}

export function StatusBadge({ active, activeLabel = 'Activo', inactiveLabel = 'Inactivo' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset',
        active
          ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
          : 'bg-slate-100 text-slate-600 ring-slate-500/20',
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', active ? 'bg-emerald-500' : 'bg-slate-400')} />
      {active ? activeLabel : inactiveLabel}
    </span>
  );
}

const roleStyles = {
  superadmin: 'bg-violet-50 text-violet-700 ring-violet-600/20',
  admin: 'bg-orange-50 text-orange-700 ring-orange-600/20',
  operador: 'bg-sky-50 text-sky-700 ring-sky-600/20',
};

export function RoleBadge({ rol, fallback = 'Sin rol' }) {
  if (!rol) {
    return <span className="text-xs text-slate-400">{fallback}</span>;
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ring-1 ring-inset',
        roleStyles[rol] ?? 'bg-slate-100 text-slate-600 ring-slate-500/20',
      )}
    >
      {rol === 'superadmin' ? 'Superadmin' : rol}
    </span>
  );
}

export function EmptyState({ icon: Icon = Inbox, title = 'Sin registros', description }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <span className="rounded-2xl bg-slate-100 p-3 text-slate-400">
        <Icon size={24} />
      </span>
      <p className="mt-3 text-sm font-semibold text-slate-700">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
    </div>
  );
}

export function DataTable({
  columns,
  rows = [],
  loading = false,
  emptyTitle,
  emptyDescription,
  emptyIcon,
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50/80">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={cn(
                    'whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500',
                    column.headerClassName,
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading &&
              Array.from({ length: 4 }).map((_, index) => (
                <tr key={`skeleton-${index}`} className="animate-pulse">
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-4">
                      <div className="h-3 rounded bg-slate-100" />
                    </td>
                  ))}
                </tr>
              ))}

            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={columns.length}>
                  <EmptyState
                    icon={emptyIcon}
                    title={emptyTitle}
                    description={emptyDescription}
                  />
                </td>
              </tr>
            )}

            {!loading &&
              rows.map((row) => (
                <tr key={row.id} className="transition hover:bg-slate-50/70">
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn('px-4 py-3.5 align-middle text-slate-600', column.className)}
                    >
                      {column.render ? column.render(row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function pageLabel(label) {
  if (label.includes('Previous')) return 'Anterior';
  if (label.includes('Next')) return 'Siguiente';
  return label;
}

export function Pagination({ paginator }) {
  if (!paginator || !paginator.links || paginator.last_page <= 1) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-500">
        Mostrando <span className="font-medium text-slate-700">{paginator.from ?? 0}</span> a{' '}
        <span className="font-medium text-slate-700">{paginator.to ?? 0}</span> de{' '}
        <span className="font-medium text-slate-700">{paginator.total}</span> registros
      </p>

      <nav className="flex flex-wrap items-center gap-1" aria-label="Paginación">
        {paginator.links.map((link, index) => {
          const label = pageLabel(link.label);
          const isEdge = index === 0 || index === paginator.links.length - 1;

          if (!link.url) {
            return (
              <span
                key={`${label}-${index}`}
                className="rounded-lg px-3 py-1.5 text-sm text-slate-300"
              >
                {label}
              </span>
            );
          }

          return (
            <Link
              key={`${label}-${index}`}
              href={link.url}
              preserveScroll
              preserveState
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm font-medium transition',
                link.active
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100',
                isEdge && 'px-2.5',
              )}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
