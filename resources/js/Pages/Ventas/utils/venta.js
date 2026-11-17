// Reglas de "Crear venta" en el navegador. El servidor vuelve a validar todo.
export const TASA_IGV = 18;
export const FACTURA = '01';
export const BOLETA = '03';
export const TICKET = '12';

/** Solo dígitos, máx. 11. */
export const limpiarDocumento = (v) => String(v ?? '').replace(/\D/g, '').slice(0, 11);

/** Cantidad ≥ 0 con hasta 4 decimales: "-", "e" y "+" no se pueden escribir. */
export const limpiarCantidad = (v) => {
  let s = String(v ?? '').replace(',', '.').replace(/[^0-9.]/g, '');
  const [ent, ...dec] = s.split('.');
  if (dec.length) s = `${ent}.${dec.join('').slice(0, 4)}`;
  return s.slice(0, 10);
};

/** Precio ≥ 0 con hasta 2 decimales. */
export const limpiarPrecio = (v) => {
  let s = String(v ?? '').replace(',', '.').replace(/[^0-9.]/g, '');
  const [ent, ...dec] = s.split('.');
  if (dec.length) s = `${ent}.${dec.join('').slice(0, 2)}`;
  return s.slice(0, 10);
};

const PESOS_RUC = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

/** RUC de 11 dígitos, prefijo SUNAT y dígito verificador módulo 11. */
export const rucValido = (ruc) => {
  if (!/^\d{11}$/.test(ruc) || !['10', '15', '16', '17', '20'].includes(ruc.slice(0, 2))) return false;
  const suma = PESOS_RUC.reduce((acc, p, i) => acc + Number(ruc[i]) * p, 0);
  let dv = 11 - (suma % 11);
  if (dv === 10) dv = 0;
  if (dv === 11) dv = 1;
  return dv === Number(ruc[10]);
};

/** 'DNI' | 'RUC' | null */
export const tipoDocumento = (doc) => {
  if (/^\d{8}$/.test(doc)) return 'DNI';
  return rucValido(doc) ? 'RUC' : null;
};

export const errorDocumento = (doc, codDocumento) => {
  if (codDocumento === FACTURA) {
    if (!doc) return 'La factura requiere el RUC del cliente.';
    return rucValido(doc) ? null : 'Ingresa un RUC válido (11 dígitos).';
  }
  if (!doc) return null;
  if (doc.length === 8) return null;
  if (doc.length === 11) return rucValido(doc) ? null : 'El RUC no es válido (revisa los dígitos).';
  return 'El documento debe tener 8 dígitos (DNI) u 11 dígitos (RUC).';
};

/** Mismo cálculo que App\Support\TotalesVenta (precios con IGV incluido). */
export const calcularTotales = (lineas) => {
  const factor = 1 + TASA_IGV / 100;
  let total = 0;
  let neto = 0;
  lineas.forEach((l) => {
    const t = Math.round((Number(l.cantidad) || 0) * (Number(l.precio_unitario) || 0) * 100) / 100;
    total += t;
    neto += Math.round((t / factor) * 100) / 100;
  });
  total = Math.round(total * 100) / 100;
  neto = Math.round(neto * 100) / 100;
  return { neto, igv: Math.round((total - neto) * 100) / 100, total };
};

/** Busca por código, código de barras o nombre, sin importar tildes ni mayúsculas. */
const normalizar = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

export const buscarEnCatalogo = (catalogo, texto, limite = 8) => {
  const q = normalizar(texto);
  if (!q) return [];
  const palabras = q.split(/\s+/);
  const exactos = [];
  const empiezan = [];
  const contienen = [];
  for (const art of catalogo) {
    const codigo = normalizar(art.codigo);
    const barra = normalizar(art.codbarra);
    const nombre = normalizar(art.nombre);
    if (codigo === q || (barra && barra === q)) exactos.push(art);
    else if (nombre.startsWith(q) || codigo.startsWith(q)) empiezan.push(art);
    else if (palabras.every((p) => nombre.includes(p) || codigo.includes(p) || barra.includes(p))) contienen.push(art);
  }
  return [...exactos, ...empiezan, ...contienen].slice(0, limite);
};

export const formatoSoles = (n) =>
  `S/ ${(Number(n) || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const formatoCantidad = (n) =>
  (Number(n) || 0).toLocaleString('es-PE', { maximumFractionDigits: 4 });

/** Convierte la respuesta 422 en { campo: mensaje }. */
export const erroresServidor = (data) =>
  Object.fromEntries(Object.entries(data?.errors ?? {}).map(([k, v]) => [k, Array.isArray(v) ? v[0] : String(v)]));
