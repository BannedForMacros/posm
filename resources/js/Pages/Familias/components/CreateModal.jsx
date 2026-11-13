// Crear / editar familia o subfamilia. El código lo asigna el sistema.
import React, { useEffect, useState } from 'react';
import Modal from '@/Components/ui/Modal';
import { Campo, PieFormulario } from '@/Pages/ArticuloManage/components/ArticuloForm';

const input =
  'mt-1 block w-full h-10 rounded-lg border px-3 text-gray-900 placeholder:text-gray-400 transition-[border-color,box-shadow] ' +
  'duration-150 ease-out focus:outline-none focus:ring-2 bg-white';
const clase = (err) => `${input} ${err ? 'border-red-500 focus:ring-red-500/30' : 'border-gray-300 focus:border-orange-500 focus:ring-orange-500/40'}`;

/**
 * @param editar   fila a editar (null = crear)
 * @param padre    código de familia preseleccionado para crear una subfamilia
 * @param familias filas de familia de 3 dígitos (posibles padres)
 * @param onGuardar (datos) => Promise<{ ok, errors, message }>
 */
export const CreateModal = ({ isOpen, onClose, editar = null, padre = null, familias = [], onGuardar }) => {
  const esEdicion = Boolean(editar);
  const [tipo, setTipo] = useState('familia');
  const [nombre, setNombre] = useState('');
  const [codPadre, setCodPadre] = useState('');
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const sub = esEdicion ? editar.codfamilia.length === 6 : Boolean(padre);
    setTipo(sub ? 'subfamilia' : 'familia');
    setNombre(esEdicion ? (sub ? editar.subfamilia : editar.familia) ?? '' : '');
    setCodPadre(esEdicion ? editar.codfamilia.slice(0, 3) : padre ?? '');
    setErrores({});
    setErrorGeneral('');
  }, [isOpen, editar, padre, esEdicion]);

  const campoNombre = tipo === 'familia' ? 'familia' : 'subfamilia';

  const guardar = async (e) => {
    e?.preventDefault();
    if (guardando) return;
    const limpio = nombre.trim().replace(/\s+/g, ' ');
    const locales = {};
    if (tipo === 'subfamilia' && !esEdicion && !codPadre) locales.codfamilia_padre = 'Selecciona la familia a la que pertenece.';
    if (!limpio) locales[campoNombre] = `Escribe el nombre de la ${tipo}.`;
    if (Object.keys(locales).length) return setErrores(locales);

    const datos = esEdicion
      ? { [campoNombre]: limpio }
      : tipo === 'familia'
        ? { tipo, familia: limpio }
        : { tipo, codfamilia_padre: codPadre, subfamilia: limpio };

    setGuardando(true);
    const res = await onGuardar(datos);
    setGuardando(false);
    if (res.ok) return onClose();
    setErrores(res.errors ?? {});
    if (!res.errors || !Object.keys(res.errors).length) setErrorGeneral(res.message);
  };

  const nombrePadre = familias.find((f) => f.codfamilia === codPadre)?.familia;
  const titulo = esEdicion
    ? `Editar ${tipo} · ${editar.codfamilia}`
    : 'Nueva familia / subfamilia';

  return (
    <Modal isOpen={isOpen} onClose={guardando ? () => {} : onClose} title={titulo}>
      <form onSubmit={guardar} noValidate className="space-y-4 p-1">
        {errorGeneral && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{errorGeneral}</div>
        )}

        {!esEdicion && (
          <div className="inline-flex rounded-lg bg-gray-100 p-1" role="tablist">
            {['familia', 'subfamilia'].map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={tipo === t}
                disabled={t === 'subfamilia' && familias.length === 0}
                onClick={() => { setTipo(t); setErrores({}); }}
                className={`h-9 rounded-md px-4 text-sm font-medium capitalize transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${
                  tipo === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        )}

        {tipo === 'subfamilia' && (
          esEdicion ? (
            <Campo label="Familia"><p className="mt-1 h-10 rounded-lg bg-gray-50 px-3 leading-10 text-gray-700">{editar.familia}</p></Campo>
          ) : (
            <Campo label="Familia" requerido error={errores.codfamilia_padre}>
              <select
                className={clase(errores.codfamilia_padre)}
                value={codPadre}
                onChange={(e) => { setCodPadre(e.target.value); setErrores((p) => ({ ...p, codfamilia_padre: undefined })); }}
              >
                <option value="">Selecciona una familia</option>
                {familias.map((f) => <option key={f.codfamilia} value={f.codfamilia}>{f.familia}</option>)}
              </select>
            </Campo>
          )
        )}

        <Campo
          label={tipo === 'familia' ? 'Nombre de la familia' : 'Nombre de la subfamilia'}
          requerido
          error={errores[campoNombre]}
          ayuda={
            esEdicion
              ? tipo === 'familia' ? 'El nuevo nombre también se aplica a sus subfamilias.' : null
              : `El código se asigna automáticamente${tipo === 'subfamilia' && nombrePadre ? ` dentro de ${nombrePadre}` : ''}.`
          }
        >
          <input
            type="text"
            className={clase(errores[campoNombre])}
            value={nombre}
            maxLength={100}
            placeholder={tipo === 'familia' ? 'Ej. Abarrotes' : 'Ej. Aceites'}
            onChange={(e) => { setNombre(e.target.value); setErrores((p) => ({ ...p, [campoNombre]: undefined })); }}
            autoFocus
          />
        </Campo>

        <PieFormulario onCancelar={onClose} onGuardar={guardar} guardando={guardando} textoGuardar={esEdicion ? 'Guardar cambios' : 'Crear'} />
      </form>
    </Modal>
  );
};
