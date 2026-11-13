// Formulario único de artículo: lo usan Crear/Editar artículo y "Nuevo producto" en Compras.
import React from 'react';
import { MAX_CODIGO, limpiarCantidad, limpiarCodBarra, limpiarCodigo } from '../utils/articulo';

const inputBase =
  'mt-1 block w-full h-10 rounded-lg border px-3 text-gray-900 placeholder:text-gray-400 ' +
  'transition-[border-color,box-shadow] duration-150 ease-out focus:outline-none focus:ring-2 ' +
  'disabled:bg-gray-100 disabled:text-gray-500';
const inputOk = 'border-gray-300 focus:border-orange-500 focus:ring-orange-500/40';
const inputErr = 'border-red-500 focus:border-red-500 focus:ring-red-500/30';

export const Campo = ({ label, requerido, error, ayuda, children }) => (
  <label className="block">
    <span className="text-sm font-medium text-gray-700">
      {label} {requerido && <span className="text-red-500">*</span>}
    </span>
    {children}
    {error ? (
      <p className="mt-1 text-sm text-red-600" role="alert">{error}</p>
    ) : ayuda ? (
      <p className="mt-1 text-xs text-gray-500">{ayuda}</p>
    ) : null}
  </label>
);

const clase = (error, extra = '') => `${inputBase} ${error ? inputErr : inputOk} ${extra}`;

/**
 * @param valores  objeto del artículo
 * @param onCambio (campo, valor) => void
 * @param errores  { campo: mensaje }
 * @param familias grupos de agruparFamilias()
 * @param codigoSugerido  siguiente código libre (placeholder)
 * @param modo     'crear' | 'editar'
 */
const ArticuloForm = ({
  valores,
  onCambio,
  errores = {},
  familias = [],
  cargandoFamilias = false,
  codigoSugerido = '',
  modo = 'crear',
  autoFocus = true,
}) => {
  const familiaSel = familias.find((f) => f.codfamilia === valores.codfamilia);
  const subfamilias = familiaSel?.subfamilias ?? [];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Campo
        label="Código"
        error={errores.codigo}
        ayuda={
          modo === 'crear'
            ? `Libre: letras, números y - _ . /${codigoSugerido ? ` · Vacío = ${codigoSugerido}` : ''}`
            : 'Letras, números y - _ . /'
        }
      >
        <input
          type="text"
          className={clase(errores.codigo, 'font-mono uppercase tracking-wide')}
          value={valores.codigo ?? ''}
          placeholder={codigoSugerido ? `Automático: ${codigoSugerido}` : 'Ej. A-001'}
          maxLength={MAX_CODIGO}
          autoComplete="off"
          spellCheck={false}
          onChange={(e) => onCambio('codigo', limpiarCodigo(e.target.value))}
          autoFocus={autoFocus && modo === 'crear'}
        />
      </Campo>

      <Campo label="Código de barras" error={errores.codbarra} ayuda="Opcional">
        <input
          type="text"
          inputMode="numeric"
          className={clase(errores.codbarra, 'font-mono')}
          value={valores.codbarra ?? ''}
          placeholder="Ej. 7750885012345"
          autoComplete="off"
          onChange={(e) => onCambio('codbarra', limpiarCodBarra(e.target.value))}
        />
      </Campo>

      <div className="sm:col-span-2">
        <Campo label="Nombre del artículo" requerido error={errores.nombrearticulo}>
          <input
            type="text"
            className={clase(errores.nombrearticulo)}
            value={valores.nombrearticulo ?? ''}
            placeholder="Ej. Arroz Costeño 750 g"
            maxLength={200}
            onChange={(e) => onCambio('nombrearticulo', e.target.value)}
            autoFocus={autoFocus && modo === 'editar'}
          />
        </Campo>
      </div>

      <div className="sm:col-span-2">
        <Campo label="Nombre corto" error={errores.nombrecorto} ayuda="Opcional · Para tickets (máx. 50). Si lo dejas vacío se usa el nombre.">
          <input
            type="text"
            className={clase(errores.nombrecorto)}
            value={valores.nombrecorto ?? ''}
            maxLength={50}
            onChange={(e) => onCambio('nombrecorto', e.target.value)}
          />
        </Campo>
      </div>

      <Campo
        label="Familia"
        error={errores.codfamilia}
        ayuda={
          !cargandoFamilias && familias.length === 0
            ? 'No hay familias aún. Créalas en el módulo Familias.'
            : 'Opcional'
        }
      >
        <select
          className={clase(errores.codfamilia, 'bg-white')}
          value={valores.codfamilia ?? ''}
          disabled={cargandoFamilias}
          onChange={(e) => {
            onCambio('codfamilia', e.target.value);
            onCambio('codsubfamilia', '');
          }}
        >
          <option value="">{cargandoFamilias ? 'Cargando familias…' : 'Sin familia'}</option>
          {familias.map((f) => (
            <option key={f.codfamilia} value={f.codfamilia}>{f.familia}</option>
          ))}
        </select>
      </Campo>

      <Campo
        label="Subfamilia"
        error={errores.codsubfamilia}
        ayuda={familiaSel && subfamilias.length === 0 ? 'Esta familia no tiene subfamilias.' : 'Opcional'}
      >
        <select
          className={clase(errores.codsubfamilia, 'bg-white')}
          value={valores.codsubfamilia ?? ''}
          disabled={!familiaSel || subfamilias.length === 0}
          onChange={(e) => onCambio('codsubfamilia', e.target.value)}
        >
          <option value="">{familiaSel ? 'Sin subfamilia' : 'Elige una familia primero'}</option>
          {subfamilias.map((s) => (
            <option key={s.code} value={s.code}>{s.label}</option>
          ))}
        </select>
      </Campo>

      <Campo label="Stock mínimo" error={errores.stockminimo} ayuda="0 o más">
        <input
          type="text"
          inputMode="decimal"
          className={clase(errores.stockminimo, 'text-right tabular-nums')}
          value={valores.stockminimo ?? ''}
          placeholder="0"
          onChange={(e) => onCambio('stockminimo', limpiarCantidad(e.target.value))}
        />
      </Campo>

      <Campo label="Stock máximo" error={errores.stockmaximo} ayuda="0 = sin límite">
        <input
          type="text"
          inputMode="decimal"
          className={clase(errores.stockmaximo, 'text-right tabular-nums')}
          value={valores.stockmaximo ?? ''}
          placeholder="0"
          onChange={(e) => onCambio('stockmaximo', limpiarCantidad(e.target.value))}
        />
      </Campo>

      {modo === 'editar' && (
        <Campo label="Estado" error={errores.estado}>
          <select
            className={clase(errores.estado, 'bg-white')}
            value={Number(valores.estado ?? 1)}
            onChange={(e) => onCambio('estado', Number(e.target.value))}
          >
            <option value={1}>Activo</option>
            <option value={0}>Inactivo</option>
          </select>
        </Campo>
      )}
    </div>
  );
};

export const PieFormulario = ({ onCancelar, onGuardar, guardando, textoGuardar = 'Guardar' }) => (
  <div className="mt-6 flex justify-end gap-3 border-t pt-4">
    <button
      type="button"
      onClick={onCancelar}
      disabled={guardando}
      className="h-10 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition-colors duration-150 hover:bg-gray-50 disabled:opacity-60"
    >
      Cancelar
    </button>
    <button
      type="submit"
      onClick={onGuardar}
      disabled={guardando}
      className="h-10 rounded-lg bg-orange-600 px-5 text-sm font-semibold text-white shadow-sm transition-[background-color,transform] duration-150 ease-out hover:bg-orange-700 active:scale-[0.98] disabled:opacity-60"
    >
      {guardando ? 'Guardando…' : textoGuardar}
    </button>
  </div>
);

export default ArticuloForm;
