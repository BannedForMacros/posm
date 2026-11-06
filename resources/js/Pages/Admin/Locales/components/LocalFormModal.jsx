import React, { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import Dialog from '@/Components/admin/Dialog';
import { Field, Select, TextInput, Toggle } from '@/Components/admin/FormControls';
import { Button } from '@/Components/ui/Button';

const emptyForm = {
  empresa_id: '',
  nombre: '',
  direccion: '',
  estado: true,
};

export default function LocalFormModal({
  open,
  onClose,
  local = null,
  empresas = [],
  defaultEmpresaId = '',
}) {
  const isEdit = Boolean(local?.id);
  const form = useForm(emptyForm);

  useEffect(() => {
    if (!open) return;

    form.clearErrors();
    form.setData(
      isEdit
        ? {
            empresa_id: String(local.empresa_id ?? ''),
            nombre: local.nombre ?? '',
            direccion: local.direccion ?? '',
            estado: Boolean(local.estado),
          }
        : {
            ...emptyForm,
            empresa_id: String(defaultEmpresaId || empresas[0]?.id || ''),
          },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, local?.id, defaultEmpresaId]);

  const submit = (event) => {
    event.preventDefault();

    const options = {
      preserveScroll: true,
      onSuccess: () => onClose(),
    };

    if (isEdit) {
      form.put(`/admin/locales/${local.id}`, options);
    } else {
      form.post('/admin/locales', options);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEdit ? 'Editar local' : 'Nuevo local'}
      description="Los locales pertenecen a una empresa y se usan en ventas, almacenes y reportes."
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={form.processing}>
            Cancelar
          </Button>
          <Button type="submit" form="local-form" isLoading={form.processing}>
            {isEdit ? 'Guardar cambios' : 'Crear local'}
          </Button>
        </>
      }
    >
      <form id="local-form" onSubmit={submit} className="space-y-4">
        <Field
          label="Empresa"
          htmlFor="local-empresa"
          error={form.errors.empresa_id}
          required
          hint={isEdit ? 'El local no se puede mover a otra empresa.' : undefined}
        >
          <Select
            id="local-empresa"
            value={form.data.empresa_id}
            onChange={(event) => form.setData('empresa_id', event.target.value)}
            error={form.errors.empresa_id}
            disabled={isEdit}
          >
            <option value="">Selecciona una empresa</option>
            {empresas.map((empresa) => (
              <option key={empresa.id} value={empresa.id}>
                {empresa.nombre} · {empresa.ruc}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Nombre del local" htmlFor="local-nombre" error={form.errors.nombre} required>
          <TextInput
            id="local-nombre"
            value={form.data.nombre}
            onChange={(event) => form.setData('nombre', event.target.value)}
            error={form.errors.nombre}
            placeholder="Local Centro"
          />
        </Field>

        <Field label="Dirección" htmlFor="local-direccion" error={form.errors.direccion}>
          <TextInput
            id="local-direccion"
            value={form.data.direccion}
            onChange={(event) => form.setData('direccion', event.target.value)}
            error={form.errors.direccion}
            placeholder="Jr. Comercio 456"
          />
        </Field>

        <Toggle
          checked={form.data.estado}
          onChange={(value) => form.setData('estado', value)}
          label="Local activo"
          description="Los locales inactivos dejan de estar disponibles para nuevas operaciones."
        />
      </form>
    </Dialog>
  );
}
