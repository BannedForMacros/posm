// Utilidades compartidas del módulo de artículos (crear/editar, compras, ventas).
import { useCallback, useEffect, useState } from 'react';

/** Mismo patrón que el backend: letras, números y - _ . /, sin espacios. */
export const PATRON_CODIGO = /^[A-Z0-9][A-Z0-9\-_./]*$/;
export const MAX_CODIGO = 30;

/** Normaliza lo que se escribe en "Código": mayúsculas y solo caracteres permitidos. */
export const limpiarCodigo = (valor) =>
  String(valor ?? '').toUpperCase().replace(/[^A-Z0-9\-_./]/g, '').slice(0, MAX_CODIGO);

/** Código de barras: letras, números y guiones. */
export const limpiarCodBarra = (valor) =>
  String(valor ?? '').replace(/[^A-Za-z0-9-]/g, '').slice(0, 50);

/**
 * Cantidad no negativa con hasta 4 decimales. No deja escribir "-", "e" ni "+":
 * cualquier carácter que no sea dígito o punto se descarta mientras se escribe.
 */
export const limpiarCantidad = (valor) => {
  let v = String(valor ?? '').replace(',', '.').replace(/[^0-9.]/g, '');
  const [entero, ...resto] = v.split('.');
  if (resto.length) v = `${entero}.${resto.join('').slice(0, 4)}`;
  return v.slice(0, 12);
};

/** Código que el usuario ve: el libre; si no existe, el ID interno. */
export const codigoVisible = (art) => art?.codigo || String(art?.codarticulo ?? '');

/** Búsqueda por código, código de barras o nombre (sin distinguir mayúsculas). */
export const coincideArticulo = (art, filtro) => {
  const f = String(filtro ?? '').trim().toLowerCase();
  if (!f) return true;
  return [codigoVisible(art), art.codbarra, art.nombrearticulo, art.nombrecorto]
    .some((v) => String(v ?? '').toLowerCase().includes(f));
};

/**
 * Validación en el navegador (la definitiva la hace el servidor).
 * Devuelve { campo: 'mensaje' }; objeto vacío = válido.
 */
export const validarArticulo = (a) => {
  const e = {};
  const codigo = String(a.codigo ?? '').trim();
  const nombre = String(a.nombrearticulo ?? '').trim();

  if (codigo && !PATRON_CODIGO.test(codigo)) {
    e.codigo = 'Solo letras, números y - _ . / (debe empezar con letra o número).';
  }
  if (!nombre) e.nombrearticulo = 'Escribe el nombre del artículo.';
  else if (nombre.length < 2) e.nombrearticulo = 'El nombre debe tener al menos 2 caracteres.';
  if (a.codsubfamilia && !a.codfamilia) e.codsubfamilia = 'Selecciona primero la familia.';

  const min = a.stockminimo === '' || a.stockminimo == null ? null : Number(a.stockminimo);
  const max = a.stockmaximo === '' || a.stockmaximo == null ? null : Number(a.stockmaximo);
  if (min !== null && (Number.isNaN(min) || min < 0)) e.stockminimo = 'Debe ser un número mayor o igual a 0.';
  if (max !== null && (Number.isNaN(max) || max < 0)) e.stockmaximo = 'Debe ser un número mayor o igual a 0.';
  if (!e.stockminimo && !e.stockmaximo && min !== null && max !== null && max > 0 && max < min) {
    e.stockmaximo = 'No puede ser menor que el stock mínimo.';
  }
  return e;
};

/** Convierte la respuesta 422 de Laravel en { campo: 'primer mensaje' }. */
export const erroresDeServidor = (data) =>
  Object.fromEntries(Object.entries(data?.errors ?? {}).map(([k, v]) => [k, Array.isArray(v) ? v[0] : String(v)]));

/**
 * Agrupa las filas de la tabla `familia` en familias con sus subfamilias.
 * Familia = código de 3 dígitos; subfamilia = 6 dígitos (familia + sub).
 */
export const agruparFamilias = (filas = []) => {
  const mapa = new Map();
  const activas = filas.filter((f) => f?.codfamilia && Number(f.estado ?? 1) === 1);

  activas
    .filter((f) => f.codfamilia.length === 3)
    .forEach((f) => mapa.set(f.codfamilia, { codfamilia: f.codfamilia, familia: f.familia, subfamilias: [] }));

  activas
    .filter((f) => f.codfamilia.length === 6)
    .forEach((f) => {
      const fam = f.codfamilia.slice(0, 3);
      const sub = f.codfamilia.slice(3);
      if (!mapa.has(fam)) mapa.set(fam, { codfamilia: fam, familia: f.familia, subfamilias: [] });
      const grupo = mapa.get(fam);
      if (!grupo.subfamilias.some((s) => s.code === sub)) {
        grupo.subfamilias.push({ code: sub, label: f.subfamilia || f.familia });
      }
    });

  const porNombre = (a, b) => String(a).localeCompare(String(b), 'es', { sensitivity: 'base' });
  return Array.from(mapa.values())
    .map((g) => ({ ...g, subfamilias: g.subfamilias.sort((a, b) => porNombre(a.label, b.label)) }))
    .sort((a, b) => porNombre(a.familia, b.familia));
};

/** Nombre legible de familia / subfamilia de un artículo. */
export const nombresFamilia = (grupos, art) => {
  const fam = grupos.find((g) => g.codfamilia === art?.codfamilia);
  const sub = fam?.subfamilias.find((s) => s.code === art?.codsubfamilia);
  return { familia: fam?.familia ?? '', subfamilia: sub?.label ?? '' };
};

/** Carga las familias de la empresa una sola vez. */
export const useFamiliasCatalogo = (activo = true) => {
  const [familias, setFamilias] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const recargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const r = await fetch('/api/familias', { headers: { Accept: 'application/json' } });
      if (!r.ok) throw new Error('No se pudieron cargar las familias.');
      const data = await r.json();
      setFamilias(agruparFamilias(Array.isArray(data) ? data : []));
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    if (activo) recargar();
  }, [activo, recargar]);

  return { familias, cargando, error, recargar };
};

/** Pide al servidor el siguiente código numérico libre (solo como sugerencia). */
export const obtenerCodigoSugerido = async () => {
  try {
    const r = await fetch('/api/articulos-manage/siguiente-codigo', { headers: { Accept: 'application/json' } });
    if (!r.ok) return '';
    return (await r.json()).codigo ?? '';
  } catch {
    return '';
  }
};

/** POST/PUT de un artículo. Devuelve { ok, data, errors, message }. */
export const guardarArticulo = async (articulo, { id } = {}) => {
  const cuerpo = {
    codigo: String(articulo.codigo ?? '').trim() || null,
    nombrearticulo: String(articulo.nombrearticulo ?? '').trim(),
    nombrecorto: String(articulo.nombrecorto ?? '').trim() || null,
    codbarra: String(articulo.codbarra ?? '').trim() || null,
    codfamilia: articulo.codfamilia || null,
    codsubfamilia: articulo.codsubfamilia || null,
    stockminimo: articulo.stockminimo === '' || articulo.stockminimo == null ? null : Number(articulo.stockminimo),
    stockmaximo: articulo.stockmaximo === '' || articulo.stockmaximo == null ? null : Number(articulo.stockmaximo),
  };
  if (id && articulo.estado !== undefined) cuerpo.estado = Number(articulo.estado);

  try {
    const r = await fetch(id ? `/api/articulos-manage/${id}` : '/api/articulos-manage', {
      method: id ? 'PUT' : 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(cuerpo),
    });
    const data = await r.json().catch(() => ({}));
    if (r.ok) return { ok: true, data: data.data, message: data.message };
    if (r.status === 422) return { ok: false, errors: erroresDeServidor(data), message: data.message };
    return { ok: false, errors: {}, message: data.message || `Error ${r.status} al guardar el artículo.` };
  } catch {
    return { ok: false, errors: {}, message: 'No se pudo conectar con el servidor.' };
  }
};
