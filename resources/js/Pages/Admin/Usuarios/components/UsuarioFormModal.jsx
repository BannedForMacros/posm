import React, { useEffect, useMemo } from 'react';
import { useForm } from '@inertiajs/react';
import { Plus, Trash2 } from 'lucide-react';
import Dialog from '@/Components/admin/Dialog';
import { Field, Select, TextInput, Toggle } from '@/Components/admin/FormControls';
import { Button } from '@/Components/ui/Button';

const emptyForm = {
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
  is_superadmin: false,
  activo: true,
  empresas: [],
};

export default function UsuarioFormModal({ open, onClose, usuario = null, empresas = [] }) {
  const isEdit = Boolean(usuario?.id);
  const form = useForm(emptyForm);

  useEffect(() => {
    if (!open) return;

    form.clearErrors();
    form.setData(
      isEdit
        ? {
            name: usuario.name ?? '',
            email: usuario.email ?? '',
            password: '',
            password_confirmation: '',
            is_superadmin: Boolean(usuario.is_superadmin),
            activo: Boolean(usuario.activo),
            empresas: (usuario.empresas ?? []).map((empresa) => ({
              id: Number(empresa.id),
              rol: empresa.rol ?? 'operador',
            })),
          }
        : emptyForm,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, usuario?.id]);

  const empresasDisponibles = useMemo(
    () => empresas.filter((empresa) => !form.data.empresas.some((item) => Number(item.id) === empresa.id)),
    [empresas, form.data.empresas],
  );

  const addEmpresa = () => {
    const next = empresasDisponibles[0];
    if (!next) return;

    form.setData('empresas', [...form.data.empresas, { id: next.id, rol: 'operador' }]);
  };

  const updateEmpresa = (index, field, value) => {
    form.setData(
      'empresas',
      form.data.empresas.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    );
  };

  const removeEmpresa = (index) => {
    form.setData(
      'empresas',
      form.data.empresas.filter((_, itemIndex) => itemIndex !== index),
    );
  };

  const submit = (event) => {
    event.preventDefault();

    const options = {
      preserveScroll: true,
      onSuccess: () => onClose(),
    };

    if (isEdit) {
      form.put(`/admin/usuarios/${usuario.id}`, options);
    } else {
      form.post('/admin/usuarios', options);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEdit ? 'Editar usuario' : 'Nuevo usuario'}
      description="Un usuario puede pertenecer a una o varias empresas con un rol distinto en cada una."
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={form.processing}>
            Cancelar
          </Button>
          <Button type="submit" form="usuario-form" isLoading={form.processing}>
            {isEdit ? 'Guardar cambios' : 'Crear usuario'}
          </Button>
        </>
      }
    >
      <form id="usuario-form" onSubmit={submit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre completo" htmlFor="usuario-name" error={form.errors.name} required>
            <TextInput
              id="usuario-name"
              value={form.data.name}
              onChange={(event) => form.setData('name', event.target.value)}
              error={form.errors.name}
              placeholder="Ana Torres"
            />
          </Field>

          <Field label="Correo" htmlFor="usuario-email" error={form.errors.email} required>
            <TextInput
              id="usuario-email"
              type="email"
              value={form.data.email}
              onChange={(event) => form.setData('email', event.target.value)}
              error={form.errors.email}
              placeholder="ana@empresa.com"
            />
          </Field>

          <Field
            label="Contraseña"
            htmlFor="usuario-password"
            error={form.errors.password}
            required={!isEdit}
            hint={isEdit ? 'Déjala vacía para mantener la contraseña actual.' : 'Mínimo 8 caracteres.'}
          >
            <TextInput
              id="usuario-password"
              type="password"
              value={form.data.password}
              onChange={(event) => form.setData('password', event.target.value)}
              error={form.errors.password}
              autoComplete="new-password"
            />
          </Field>

          <Field
            label="Confirmar contraseña"
            htmlFor="usuario-password-confirmation"
            error={form.errors.password_confirmation}
            required={!isEdit}
          >
            <TextInput
              id="usuario-password-confirmation"
              type="password"
              value={form.data.password_confirmation}
              onChange={(event) => form.setData('password_confirmation', event.target.value)}
              error={form.errors.password_confirmation}
              autoComplete="new-password"
            />
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Toggle
            checked={form.data.activo}
            onChange={(value) => form.setData('activo', value)}
            label="Usuario activo"
            description="Si se desactiva, no podrá iniciar sesión."
          />
          <Toggle
            checked={form.data.is_superadmin}
            onChange={(value) => form.setData('is_superadmin', value)}
            label="Superadministrador"
            description="Acceso total al panel de empresas, usuarios y locales."
          />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-semibold text-slate-800">Empresas asignadas</h4>
              <p className="mt-0.5 text-xs text-slate-500">
                El usuario verá un selector para cambiar de empresa al iniciar sesión.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={Plus}
              onClick={addEmpresa}
              disabled={empresasDisponibles.length === 0}
            >
              Agregar empresa
            </Button>
          </div>

          {form.data.empresas.length === 0 && (
            <p className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-5 text-center text-sm text-slate-500">
              Sin empresas asignadas. El usuario no podrá operar hasta que se le asigne una.
            </p>
          )}

          <div className="mt-4 space-y-2">
            {form.data.empresas.map((item, index) => (
              <div
                key={`${item.id}-${index}`}
                className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center"
              >
                <Select
                  value={item.id}
                  onChange={(event) => updateEmpresa(index, 'id', Number(event.target.value))}
                  className="sm:flex-1"
                >
                  {empresas.map((empresa) => (
                    <option
                      key={empresa.id}
                      value={empresa.id}
                      disabled={
                        Number(empresa.id) !== Number(item.id) &&
                        form.data.empresas.some((selected) => Number(selected.id) === empresa.id)
                      }
                    >
                      {empresa.nombre} · {empresa.ruc}
                      {!empresa.estado ? ' (inactiva)' : ''}
                    </option>
                  ))}
                </Select>

                <Select
                  value={item.rol}
                  onChange={(event) => updateEmpresa(index, 'rol', event.target.value)}
                  className="sm:w-44"
                >
                  <option value="operador">Operador</option>
                  <option value="admin">Administrador</option>
                </Select>

                <button
                  type="button"
                  onClick={() => removeEmpresa(index)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50"
                >
                  <Trash2 size={14} />
                  Quitar
                </button>
              </div>
            ))}
          </div>

          {form.errors.empresas && (
            <p className="mt-2 text-xs font-medium text-red-600">{form.errors.empresas}</p>
          )}
        </div>
      </form>
    </Dialog>
  );
}
