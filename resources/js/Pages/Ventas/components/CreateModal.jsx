// Crear venta: comprobante (tipo/serie/correlativo automático), cliente, artículos y totales.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import ModalGrande from '@/Components/ui/ModalGrande';
import Swal from 'sweetalert2';
import { Lock, Plus, Trash2, X, Check } from 'lucide-react';
import { Campo, PieFormulario } from '@/Pages/ArticuloManage/components/ArticuloForm';
import ArticuloAutocomplete from './ArticuloAutocomplete';
import ClienteSection from './ClienteSection';
import {
  BOLETA, FACTURA, calcularTotales, errorDocumento, erroresServidor, formatoCantidad, formatoSoles,
  limpiarCantidad, limpiarPrecio,
} from '../utils/venta';

const select =
  'mt-1 block w-full h-10 rounded-lg border bg-white px-3 text-gray-900 transition-[border-color,box-shadow] duration-150 focus:outline-none focus:ring-2 disabled:bg-gray-100';
const clase = (err) => `${select} ${err ? 'border-red-500 focus:ring-red-500/30' : 'border-gray-300 focus:border-orange-500 focus:ring-orange-500/40'}`;
const celda = (err) =>
  `h-10 w-full rounded-lg border px-2 text-right text-sm tabular-nums focus:outline-none focus:ring-2 ${
    err ? 'border-red-500 focus:ring-red-500/30' : 'border-gray-300 focus:border-orange-500 focus:ring-orange-500/40'
  }`;

let siguienteId = 1;
const lineaVacia = () => ({ id: siguienteId++, articulo: null, cantidad: '', precio_unitario: '', precioEditado: false });
const clienteVacio = { cliente_documento: '', cliente_nombre: '', cliente_direccion: '', cliente_fuente: 'manual' };
const formatoFecha = (iso) => (iso ? iso.split('-').reverse().join('/') : '');
const getJson = async (url) => {
  const r = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!r.ok) throw new Error(`Error ${r.status}`);
  return r.json();
};

const CreateSaleModal = ({ isOpen, onClose, onCreated }) => {
  const [config, setConfig] = useState(null);
  const [errorCarga, setErrorCarga] = useState('');
  const [tipo, setTipo] = useState(BOLETA);
  const [series, setSeries] = useState([]);
  const [serie, setSerie] = useState('');
  const [nuevaSerie, setNuevaSerie] = useState(null); // null = cerrado; string = escribiendo
  const [almacenId, setAlmacenId] = useState('');
  const [listaId, setListaId] = useState('');
  const [catalogo, setCatalogo] = useState([]);
  const [cargandoCatalogo, setCargandoCatalogo] = useState(false);
  const [cliente, setCliente] = useState(clienteVacio);
  const [lineas, setLineas] = useState([lineaVacia()]);
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState('');
  const [guardando, setGuardando] = useState(false);
  const refsArticulo = useRef({});
  const refsCantidad = useRef({});

  // ---- Carga inicial ----
  useEffect(() => {
    if (!isOpen) return;
    setTipo(BOLETA);
    setCliente(clienteVacio);
    setLineas([lineaVacia()]);
    setErrores({});
    setErrorGeneral('');
    setNuevaSerie(null);
    setErrorCarga('');
    getJson('/api/ventas/configuracion')
      .then((c) => {
        setConfig(c);
        setAlmacenId(c.almacenes[0] ? String(c.almacenes[0].id) : '');
        setListaId(c.listas_precios[0] ? String(c.listas_precios[0].id) : '');
      })
      .catch(() => setErrorCarga('No se pudo cargar la configuración de ventas.'));
  }, [isOpen]);

  const cargarSeries = useCallback(async (cod, preferida = null) => {
    try {
      const data = await getJson(`/api/ventas/series?cod_documento=${cod}`);
      setSeries(data);
      setSerie(preferida ?? data[0]?.serie ?? '');
    } catch {
      setSeries([]);
      setSerie('');
    }
  }, []);

  useEffect(() => {
    if (isOpen && config) cargarSeries(tipo);
  }, [isOpen, config, tipo, cargarSeries]);

  // Catálogo (precio según lista, stock según almacén)
  useEffect(() => {
    if (!isOpen || !config) return;
    setCargandoCatalogo(true);
    getJson(`/api/ventas/catalogo?lista_precios_id=${listaId}&almacen_id=${almacenId}`)
      .then(setCatalogo)
      .catch(() => setCatalogo([]))
      .finally(() => setCargandoCatalogo(false));
  }, [isOpen, config, listaId, almacenId]);

  // Al cambiar lista/almacén: refrescar stock y el precio de las líneas que no se editaron a mano.
  useEffect(() => {
    if (!catalogo.length) return;
    const porId = new Map(catalogo.map((a) => [a.codarticulo, a]));
    setLineas((prev) =>
      prev.map((l) => {
        if (!l.articulo) return l;
        const art = porId.get(l.articulo.codarticulo) ?? l.articulo;
        return {
          ...l,
          articulo: art,
          precio_unitario: l.precioEditado || art.precio === null ? l.precio_unitario : String(art.precio),
        };
      })
    );
  }, [catalogo]);

  // ---- Derivados ----
  const lineasConArticulo = lineas.filter((l) => l.articulo);
  const totales = useMemo(() => calcularTotales(lineasConArticulo), [lineasConArticulo]);
  const correlativo = series.find((s) => s.serie === serie)?.siguiente;
  const tipoNombre = config?.tipos.find((t) => t.codigo === tipo)?.nombre ?? '';
  const pedidoPorArticulo = useMemo(() => {
    const m = new Map();
    lineasConArticulo.forEach((l) => m.set(l.articulo.codarticulo, (m.get(l.articulo.codarticulo) ?? 0) + (Number(l.cantidad) || 0)));
    return m;
  }, [lineasConArticulo]);

  const limpiarError = (...campos) =>
    setErrores((prev) => {
      if (!campos.some((c) => prev[c])) return prev;
      const copia = { ...prev };
      campos.forEach((c) => delete copia[c]);
      return copia;
    });

  // ---- Líneas ----
  const actualizarLinea = (id, cambios) => setLineas((prev) => prev.map((l) => (l.id === id ? { ...l, ...cambios } : l)));

  const agregarLinea = () => {
    const nueva = lineaVacia();
    setLineas((prev) => [...prev, nueva]);
    setTimeout(() => refsArticulo.current[nueva.id]?.focus(), 50);
  };

  const quitarLinea = (id) => setLineas((prev) => (prev.length === 1 ? [lineaVacia()] : prev.filter((l) => l.id !== id)));

  const seleccionarArticulo = (linea, idx, art) => {
    // flushSync: la cantidad se habilita y recibe el foco en el mismo instante, así
    // ninguna tecla (p. ej. de un lector de código de barras) cae en el campo artículo.
    flushSync(() => {
      actualizarLinea(linea.id, {
        articulo: art,
        cantidad: linea.cantidad || '1',
        precio_unitario: art.precio !== null ? String(art.precio) : '',
        precioEditado: false,
      });
      limpiarError(`detalles.${idx}.cod_articulo`, 'detalles');
      // La última línea siempre queda libre para seguir agregando.
      if (idx === lineas.length - 1) setLineas((prev) => [...prev, lineaVacia()]);
    });
    refsCantidad.current[linea.id]?.focus();
    refsCantidad.current[linea.id]?.select();
  };

  // ---- Series ----
  const crearSerie = async () => {
    const valor = (nuevaSerie ?? '').toUpperCase().trim();
    const patron = tipo === FACTURA ? /^F[A-Z0-9]{3}$/ : tipo === BOLETA ? /^B[A-Z0-9]{3}$/ : /^[A-Z0-9]{1,4}$/;
    if (!patron.test(valor)) {
      setErrores((p) => ({
        ...p,
        nueva_serie: tipo === FACTURA ? 'Debe empezar con F y tener 4 caracteres (ej. F001).'
          : tipo === BOLETA ? 'Debe empezar con B y tener 4 caracteres (ej. B001).'
            : 'De 1 a 4 letras o números (ej. T001).',
      }));
      return;
    }
    const r = await fetch('/api/ventas/series', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ cod_documento: tipo, serie: valor }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      setErrores((p) => ({ ...p, nueva_serie: erroresServidor(data).serie || data.message || 'No se pudo crear la serie.' }));
      return;
    }
    setNuevaSerie(null);
    limpiarError('nueva_serie', 'seri_venta');
    await cargarSeries(tipo, data.data.serie);
  };

  // ---- Validación local ----
  const validar = () => {
    const e = {};
    if (!serie) e.seri_venta = 'Selecciona o crea una serie.';
    if (!almacenId) e.almacen_id = 'Selecciona el almacén de salida.';
    const errDoc = errorDocumento(cliente.cliente_documento, tipo);
    if (errDoc) e.cliente_documento = errDoc;
    if ((tipo === FACTURA || cliente.cliente_documento) && !cliente.cliente_nombre.trim()) {
      e.cliente_nombre = 'Ingresa el nombre o razón social.';
    }
    if (tipo === BOLETA && !cliente.cliente_documento && config && totales.total >= config.boleta_monto_identificacion) {
      e.cliente_documento = `Las boletas desde ${formatoSoles(config.boleta_monto_identificacion)} requieren DNI o RUC.`;
    }
    if (lineasConArticulo.length === 0) e.detalles = 'Agrega al menos un artículo.';
    lineasConArticulo.forEach((l) => {
      const idx = lineas.indexOf(l);
      if (!(Number(l.cantidad) > 0)) e[`detalles.${idx}.cantidad`] = 'Mayor a 0';
      if (l.precio_unitario === '' || Number(l.precio_unitario) < 0) e[`detalles.${idx}.precio_unitario`] = 'Ingresa el precio';
      const stock = l.articulo.stock;
      if (stock !== null && (pedidoPorArticulo.get(l.articulo.codarticulo) ?? 0) > stock) {
        e[`detalles.${idx}.cantidad`] = `Stock: ${formatoCantidad(stock)}`;
      }
    });
    return e;
  };

  // ---- Guardar ----
  const guardar = async (ev) => {
    ev?.preventDefault();
    if (guardando) return;
    const locales = validar();
    if (Object.keys(locales).length) {
      setErrores(locales);
      setErrorGeneral('Revisa los campos marcados.');
      return;
    }
    setGuardando(true);
    setErrorGeneral('');

    // Los índices del servidor corresponden a las líneas enviadas: se mapean de vuelta.
    const enviadas = lineasConArticulo;
    const payload = {
      cod_documento: tipo,
      seri_venta: serie,
      almacen_id: Number(almacenId),
      lista_precios_id: listaId ? Number(listaId) : null,
      ...cliente,
      detalles: enviadas.map((l) => ({
        cod_articulo: l.articulo.codarticulo,
        cantidad: Number(l.cantidad),
        precio_unitario: Number(l.precio_unitario),
      })),
    };

    try {
      const r = await fetch('/api/ventas', {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await r.json().catch(() => ({}));
      if (r.ok) {
        Swal.fire({ icon: 'success', title: 'Venta registrada', text: data.message, timer: 2500, showConfirmButton: false });
        onCreated?.();
        onClose();
        return;
      }
      if (r.status === 422) {
        const errs = erroresServidor(data);
        const remapeados = {};
        Object.entries(errs).forEach(([k, v]) => {
          const m = k.match(/^detalles\.(\d+)\.(.+)$/);
          remapeados[m ? `detalles.${lineas.indexOf(enviadas[Number(m[1])])}.${m[2]}` : k] = v;
        });
        setErrores(remapeados);
        setErrorGeneral(remapeados.detalles || 'Revisa los campos marcados.');
        if (remapeados.seri_venta) cargarSeries(tipo);
      } else {
        setErrorGeneral(data.message || `No se pudo registrar la venta (error ${r.status}).`);
      }
    } catch {
      setErrorGeneral('No se pudo conectar con el servidor.');
    } finally {
      setGuardando(false);
    }
  };

  // ---- Render ----
  return (
    <ModalGrande isOpen={isOpen} onClose={guardando ? () => {} : onClose} title="Nueva venta">
      {errorCarga ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{errorCarga}</div>
      ) : !config ? (
        <div className="space-y-3 p-2">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-100" />)}
        </div>
      ) : (
        <form
          onSubmit={guardar}
          noValidate
          className="space-y-5"
          // Enter nunca emite el comprobante por accidente: solo el botón "Emitir".
          onKeyDown={(e) => { if (e.key === 'Enter' && e.target.tagName === 'INPUT') e.preventDefault(); }}
        >
          {errorGeneral && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700" role="alert">{errorGeneral}</div>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(320px,380px)_1fr]">
            {/* ===== Columna izquierda: comprobante + cliente ===== */}
            <div className="space-y-5">
              <fieldset className="space-y-3">
                <legend className="mb-1 text-sm font-semibold text-gray-800">Comprobante</legend>

                <div className="inline-flex w-full rounded-lg bg-gray-100 p-1" role="tablist">
                  {config.tipos.map((t) => (
                    <button
                      key={t.codigo}
                      type="button"
                      role="tab"
                      aria-selected={tipo === t.codigo}
                      onClick={() => {
                        setTipo(t.codigo);
                        setNuevaSerie(null);
                        limpiarError('seri_venta', 'cliente_documento', 'cliente_nombre', 'nueva_serie');
                      }}
                      className={`h-9 flex-1 rounded-md text-sm font-medium transition-colors duration-150 ${
                        tipo === t.codigo ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {t.nombre}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Campo label="Serie" requerido error={errores.seri_venta || errores.nueva_serie}>
                    {nuevaSerie === null ? (
                      <div className="mt-1 flex gap-1.5">
                        <select
                          className={`${clase(errores.seri_venta)} mt-0`}
                          value={serie}
                          onChange={(e) => { setSerie(e.target.value); limpiarError('seri_venta'); }}
                          disabled={series.length === 0}
                        >
                          {series.length === 0 && <option value="">Sin series</option>}
                          {series.map((s) => <option key={s.serie} value={s.serie}>{s.serie}</option>)}
                        </select>
                        <button
                          type="button"
                          title="Nueva serie"
                          aria-label="Nueva serie"
                          onClick={() => setNuevaSerie(config.tipos.find((t) => t.codigo === tipo)?.ejemplo ?? '')}
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-300 text-gray-600 transition-colors duration-150 hover:bg-gray-50"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="mt-1 flex gap-1.5">
                        <input
                          autoFocus
                          className={`${clase(errores.nueva_serie)} mt-0 font-mono uppercase`}
                          value={nuevaSerie}
                          maxLength={4}
                          onChange={(e) => { setNuevaSerie(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')); limpiarError('nueva_serie'); }}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); crearSerie(); } }}
                        />
                        <button type="button" aria-label="Guardar serie" onClick={crearSerie}
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-600 text-white hover:bg-orange-700">
                          <Check className="h-4 w-4" />
                        </button>
                        <button type="button" aria-label="Cancelar" onClick={() => { setNuevaSerie(null); limpiarError('nueva_serie'); }}
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </Campo>

                  <Campo label="Correlativo" ayuda="Automático">
                    <div className="mt-1 flex h-10 items-center rounded-lg bg-gray-50 px-3 font-mono tabular-nums text-gray-800">
                      {serie && correlativo ? `${serie}-${correlativo}` : '—'}
                    </div>
                  </Campo>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Campo label="Fecha">
                    <div className="mt-1 flex h-10 items-center gap-2 rounded-lg bg-gray-50 px-3 tabular-nums text-gray-800" title="La fecha de emisión es la de hoy y no se puede modificar">
                      <Lock className="h-3.5 w-3.5 text-gray-400" />
                      {formatoFecha(config.fecha)}
                    </div>
                  </Campo>
                  <Campo label="Almacén" requerido error={errores.almacen_id}>
                    <select className={clase(errores.almacen_id)} value={almacenId}
                      onChange={(e) => { setAlmacenId(e.target.value); limpiarError('almacen_id'); }}>
                      {config.almacenes.length === 0 && <option value="">Sin almacenes</option>}
                      {config.almacenes.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                    </select>
                  </Campo>
                </div>

                <Campo label="Lista de precios" ayuda={config.listas_precios.length === 0 ? 'No hay listas: el precio se ingresa manualmente.' : 'Define el precio por defecto de cada artículo'}>
                  <select className={clase(false)} value={listaId} onChange={(e) => setListaId(e.target.value)} disabled={config.listas_precios.length === 0}>
                    {config.listas_precios.length === 0 && <option value="">—</option>}
                    {config.listas_precios.map((l) => <option key={l.id} value={l.id}>{l.nombre}</option>)}
                  </select>
                </Campo>
              </fieldset>

              <ClienteSection
                codDocumento={tipo}
                cliente={cliente}
                errores={errores}
                onCambio={(cambios) => {
                  setCliente((prev) => ({ ...prev, ...cambios }));
                  limpiarError(...Object.keys(cambios));
                }}
              />
            </div>

            {/* ===== Columna derecha: artículos + totales ===== */}
            <div className="flex min-w-0 flex-col">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-800">
                  Artículos <span className="font-normal text-gray-500 tabular-nums">({lineasConArticulo.length})</span>
                </h3>
                <button type="button" onClick={agregarLinea}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-700 transition-colors duration-150 hover:bg-gray-50">
                  <Plus className="h-4 w-4" /> Agregar línea
                </button>
              </div>

              <div className="rounded-xl border border-gray-200">
                <div className="hidden grid-cols-[1fr_96px_112px_104px_40px] gap-2 border-b bg-gray-50 px-3 py-2 text-xs font-medium uppercase tracking-wide text-gray-500 md:grid">
                  <span>Artículo</span><span className="text-right">Cantidad</span><span className="text-right">P. unit.</span>
                  <span className="text-right">Subtotal</span><span />
                </div>
                <div className="divide-y divide-gray-100">
                  {lineas.map((l, idx) => {
                    const subtotal = (Number(l.cantidad) || 0) * (Number(l.precio_unitario) || 0);
                    const errCant = errores[`detalles.${idx}.cantidad`];
                    const errPrecio = errores[`detalles.${idx}.precio_unitario`];
                    return (
                      <div key={l.id} className="grid grid-cols-[1fr_96px_112px] items-start gap-2 px-3 py-2 md:grid-cols-[1fr_96px_112px_104px_40px]">
                        <div className="col-span-3 md:col-span-1">
                          <ArticuloAutocomplete
                            ref={(el) => (refsArticulo.current[l.id] = el)}
                            catalogo={catalogo}
                            cargando={cargandoCatalogo && catalogo.length === 0}
                            seleccionado={l.articulo}
                            error={errores[`detalles.${idx}.cod_articulo`]}
                            onSeleccionar={(art) => seleccionarArticulo(l, idx, art)}
                          />
                          {l.articulo && (
                            <p className="mt-1 truncate text-xs text-gray-500">
                              <span className="font-mono">{l.articulo.codigo}</span> · {l.articulo.unidad}
                              {l.articulo.stock !== null && <> · Stock {formatoCantidad(l.articulo.stock)}</>}
                              {l.articulo.precio === null && <span className="text-amber-600"> · sin precio en la lista</span>}
                            </p>
                          )}
                        </div>
                        <div>
                          <input
                            ref={(el) => (refsCantidad.current[l.id] = el)}
                            type="text" inputMode="decimal" aria-label="Cantidad"
                            className={celda(errCant)} placeholder="0" value={l.cantidad} disabled={!l.articulo}
                            onChange={(e) => { actualizarLinea(l.id, { cantidad: limpiarCantidad(e.target.value) }); limpiarError(`detalles.${idx}.cantidad`, 'detalles'); }}
                            onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.parentElement.nextElementSibling?.querySelector('input')?.focus(); }}
                          />
                          {errCant && <p className="mt-1 text-right text-xs text-red-600">{errCant}</p>}
                        </div>
                        <div>
                          <input
                            type="text" inputMode="decimal" aria-label="Precio unitario"
                            className={celda(errPrecio)} placeholder="0.00" value={l.precio_unitario} disabled={!l.articulo}
                            onChange={(e) => { actualizarLinea(l.id, { precio_unitario: limpiarPrecio(e.target.value), precioEditado: true }); limpiarError(`detalles.${idx}.precio_unitario`); }}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); agregarLinea(); } }}
                          />
                          {errPrecio && <p className="mt-1 text-right text-xs text-red-600">{errPrecio}</p>}
                        </div>
                        <div className="hidden h-10 items-center justify-end text-sm tabular-nums text-gray-900 md:flex">
                          {l.articulo ? formatoSoles(subtotal) : ''}
                        </div>
                        <div className="hidden justify-center md:flex">
                          <button type="button" aria-label="Quitar línea" onClick={() => quitarLinea(l.id)}
                            className="flex h-10 w-9 items-center justify-center rounded-lg text-gray-400 transition-colors duration-150 hover:bg-red-50 hover:text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <dl className="ml-auto mt-4 w-full max-w-xs space-y-1.5 text-sm">
                <div className="flex justify-between text-gray-600"><dt>Op. gravada</dt><dd className="tabular-nums">{formatoSoles(totales.neto)}</dd></div>
                <div className="flex justify-between text-gray-600"><dt>IGV (18%)</dt><dd className="tabular-nums">{formatoSoles(totales.igv)}</dd></div>
                <div className="flex justify-between border-t pt-2 text-lg font-bold text-gray-900">
                  <dt>Total</dt><dd className="tabular-nums">{formatoSoles(totales.total)}</dd>
                </div>
              </dl>
            </div>
          </div>

          <PieFormulario
            onCancelar={onClose}
            onGuardar={guardar}
            guardando={guardando}
            textoGuardar={`Emitir ${tipoNombre.toLowerCase()}${totales.total > 0 ? ` · ${formatoSoles(totales.total)}` : ''}`}
          />
        </form>
      )}
    </ModalGrande>
  );
};

export default CreateSaleModal;
