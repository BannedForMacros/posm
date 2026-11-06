import React, { useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function FlashMessages() {
  const { flash } = usePage().props;
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (flash?.success) {
      setMessage({ type: 'success', text: flash.success });
    } else if (flash?.error) {
      setMessage({ type: 'error', text: flash.error });
    }
  }, [flash?.success, flash?.error]);

  useEffect(() => {
    if (!message) return undefined;

    const timer = setTimeout(() => setMessage(null), 5000);
    return () => clearTimeout(timer);
  }, [message]);

  if (!message) return null;

  const isSuccess = message.type === 'success';

  return (
    <div className="fixed right-4 top-4 z-[120] w-[calc(100%-2rem)] max-w-sm">
      <div
        className={cn(
          'flex items-start gap-3 rounded-xl border bg-white p-4 shadow-lg',
          isSuccess ? 'border-emerald-200' : 'border-red-200',
        )}
      >
        <span className={cn('mt-0.5', isSuccess ? 'text-emerald-600' : 'text-red-600')}>
          {isSuccess ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
        </span>
        <p className="flex-1 text-sm text-slate-700">{message.text}</p>
        <button
          type="button"
          onClick={() => setMessage(null)}
          className="rounded p-0.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          aria-label="Cerrar mensaje"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
