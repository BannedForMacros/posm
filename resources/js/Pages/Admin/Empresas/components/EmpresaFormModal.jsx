import React, { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import Dialog from '@/Components/admin/Dialog';
import { Field, TextInput, Toggle } from '@/Components/admin/FormControls';
import { Button } from '@/Components/ui/Button';

const emptyForm = {
  ruc: '',
  razon_social: '',
  nombre_comercial: '',
  direccion: '',
  telefono: '',
  email: '',
  estado: true,
};

export default function EmpresaFormModal({ open, onClose, empresa = null }) {
  const isEdit = Boolean(empresa?.id);
  const form = useForm(emptyForm);

  useEffect(() => {
    if (!open) return;

    form.clearErrors();
    form.setData(
      isEdit
        ? {
            ruc: empresa.ruc ?? '',
            razon_social: empresa.razon_social ?? '',
            nombre_comercial: empresa.nombre_comercial ?? '',
            direccion: empresa.direccion ?? '',
            telefono: empresa.telefono ?? '',
            email: empresa.email ?? '',
            estado: Boolean(empresa.estado),
          }
        : emptyForm,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, empresa?.id]);

  const submit = (event) => {
    event.preventDefault();

    const options = {
      preserveScroll: true,
      onSuccess: () => onClose(),
    };

    // En @inertiajs/react v2, transform() no devuelve el form (no es encadenable):
    // se configura primero y luego se envía.
    if (isEdit) {
      // El RUC identifica al tenant y no se puede modificar: no lo enviamos.
      form.transform(({ ruc, ...data }) => data);
      form.put(`/admin/empresas/${empresa.id}`, options);
    } else {
      form.transform((data) => data);
      form.post('/admin/empresas', options);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEdit ? 'Editar empresa' : 'Nueva empresa'}
      description={
        isEdit
          ? 'Actualiza los datos de contacto y el estado de la empresa.'
          : 'El RUC será la clave de la empresa en todo el sistema.'
      }
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={form.processing}>
            Cancelar
          </Button>
          <Button type="submit" form="empresa-form" isLoading={form.processing}>
            {isEdit ? 'Guardar cambios' : 'Crear empresa'}
          </Button>
        </>
      }
    >
      <form id="empresa-form" onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="RUC"
            htmlFor="empresa-ruc"
            error={form.errors.ruc}
            required
            hint={isEdit ? 'El RUC no se puede modificar.' : '11 dígitos, sin espacios.'}
          >
            <TextInput
              id="empresa-ruc"
              value={form.data.ruc}
              onChange={(event) => form.setData('ruc', event.target.value)}
              error={form.errors.ruc}
              disabled={isEdit}
              inputMode="numeric"
              maxLength={11}
              placeholder="20123456789"
            />
          </Field>

          <Field
            label="Razón social"
            htmlFor="empresa-razon-social"
            error={form.errors.razon_social}
            required
          >
            <TextInput
              id="empresa-razon-social"
              value={form.data.razon_social}
              onChange={(event) => form.setData('razon_social', event.target.value)}
              error={form.errors.razon_social}
              placeholder="Empresa SAC"
            />
          </Field>

          <Field
            label="Nombre comercial"
            htmlFor="empresa-nombre-comercial"
            error={form.errors.nombre_comercial}
          >
            <TextInput
              id="empresa-nombre-comercial"
              value={form.data.nombre_comercial}
              onChange={(event) => form.setData('nombre_comercial', event.target.value)}
              error={form.errors.nombre_comercial}
              placeholder="Nombre visible en el POS"
            />
          </Field>

          <Field label="Teléfono" htmlFor="empresa-telefono" error={form.errors.telefono}>
            <TextInput
              id="empresa-telefono"
              value={form.data.telefono}
              onChange={(event) => form.setData('telefono', event.target.value)}
              error={form.errors.telefono}
              placeholder="999 888 777"
            />
          </Field>

          <Field label="Correo" htmlFor="empresa-email" error={form.errors.email}>
            <TextInput
              id="empresa-email"
              type="email"
              value={form.data.email}
              onChange={(event) => form.setData('email', event.target.value)}
              error={form.errors.email}
              placeholder="contacto@empresa.com"
            />
          </Field>

          <Field
            label="Dirección"
            htmlFor="empresa-direccion"
            error={form.errors.direccion}
            className="sm:col-span-2"
          >
            <TextInput
              id="empresa-direccion"
              value={form.data.direccion}
              onChange={(event) => form.setData('direccion', event.target.value)}
              error={form.errors.direccion}
              placeholder="Av. Principal 123"
            />
          </Field>
        </div>

        <Toggle
          checked={form.data.estado}
          onChange={(value) => form.setData('estado', value)}
          label="Empresa activa"
          description="Si se desactiva, sus usuarios no podrán seleccionarla para operar."
        />
      </form>
    </Dialog>
  );
}
