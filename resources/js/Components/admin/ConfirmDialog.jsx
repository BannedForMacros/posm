import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Dialog from '@/Components/admin/Dialog';
import { Button } from '@/Components/ui/Button';

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = '¿Confirmar acción?',
  message,
  confirmLabel = 'Confirmar',
  processing = false,
  danger = true,
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={processing}>
            Cancelar
          </Button>
          <Button
            variant={danger ? 'danger' : 'primary'}
            onClick={onConfirm}
            isLoading={processing}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3">
        <span className="rounded-xl bg-red-50 p-2.5 text-red-600">
          <AlertTriangle size={20} />
        </span>
        <p className="pt-1 text-sm text-slate-600">{message}</p>
      </div>
    </Dialog>
  );
}
