import React from 'react';
import { cn } from '@/lib/utils';

const accents = {
  orange: {
    icon: 'bg-orange-100 text-orange-600',
    bar: 'bg-orange-500',
  },
  emerald: {
    icon: 'bg-emerald-100 text-emerald-600',
    bar: 'bg-emerald-500',
  },
  sky: {
    icon: 'bg-sky-100 text-sky-600',
    bar: 'bg-sky-500',
  },
  violet: {
    icon: 'bg-violet-100 text-violet-600',
    bar: 'bg-violet-500',
  },
};

export default function StatCard({ title, value, icon: Icon, description, accent = 'orange' }) {
  const theme = accents[accent] ?? accents.orange;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
        </div>
        {Icon && (
          <span className={cn('rounded-xl p-2.5', theme.icon)}>
            <Icon size={20} />
          </span>
        )}
      </div>
      {description && <p className="mt-3 text-xs text-slate-500">{description}</p>}
    </div>
  );
}
