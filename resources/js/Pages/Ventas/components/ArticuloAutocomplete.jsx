// Campo "Artículo" con búsqueda mientras se escribe (nombre, parte del nombre, código o cód. barras).
import React, { forwardRef, useEffect, useMemo, useRef, useState } from 'react';
import { buscarEnCatalogo, formatoCantidad, formatoSoles } from '../utils/venta';

const ArticuloAutocomplete = forwardRef(({ catalogo, seleccionado, onSeleccionar, error, cargando }, ref) => {
  const [texto, setTexto] = useState(seleccionado?.nombre ?? '');
  const [abierto, setAbierto] = useState(false);
  const [activo, setActivo] = useState(0);
  const contenedor = useRef(null);

  // Al elegir (o limpiar) el artículo desde fuera, el texto muestra su nombre.
  useEffect(() => setTexto(seleccionado?.nombre ?? ''), [seleccionado?.codarticulo, seleccionado?.nombre]);

  const resultados = useMemo(() => buscarEnCatalogo(catalogo, texto), [catalogo, texto]);

  useEffect(() => {
    const cerrar = (e) => {
      if (contenedor.current && !contenedor.current.contains(e.target)) {
        setAbierto(false);
        setTexto(seleccionado?.nombre ?? ''); // descarta lo escrito si no se eligió nada
      }
    };
    document.addEventListener('mousedown', cerrar);
    return () => document.removeEventListener('mousedown', cerrar);
  }, [seleccionado]);

  const elegir = (art) => {
    setAbierto(false);
    setTexto(art.nombre);
    onSeleccionar(art);
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setAbierto(true);
      setActivo((i) => Math.min(i + 1, resultados.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActivo((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (resultados[activo]) elegir(resultados[activo]);
    } else if (e.key === 'Escape') {
      setAbierto(false);
      setTexto(seleccionado?.nombre ?? '');
    }
  };

  return (
    <div ref={contenedor} className="relative">
      <input
        ref={ref}
        type="text"
        role="combobox"
        aria-expanded={abierto}
        aria-autocomplete="list"
        className={`h-10 w-full rounded-lg border px-3 text-sm transition-[border-color,box-shadow] duration-150 focus:outline-none focus:ring-2 ${
          error ? 'border-red-500 focus:ring-red-500/30' : 'border-gray-300 focus:border-orange-500 focus:ring-orange-500/40'
        }`}
        placeholder={cargando ? 'Cargando artículos…' : 'Escribe nombre, código o cód. barras'}
        value={texto}
        disabled={cargando}
        onChange={(e) => {
          setTexto(e.target.value);
          setActivo(0);
          setAbierto(true);
        }}
        onFocus={(e) => {
          e.target.select();
          if (texto && !seleccionado) setAbierto(true);
        }}
        onKeyDown={onKeyDown}
      />

      {abierto && texto.trim() !== '' && (
        <ul
          role="listbox"
          className="absolute left-0 z-30 mt-1 w-[min(640px,85vw)] max-h-72 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
        >
          {resultados.length === 0 && (
            <li className="px-3 py-3 text-sm text-gray-500">Sin coincidencias para “{texto}”.</li>
          )}
          {resultados.map((art, i) => {
            const sinStock = art.stock !== null && art.stock <= 0;
            return (
              <li
                key={art.codarticulo}
                role="option"
                aria-selected={i === activo}
                onMouseDown={(e) => {
                  e.preventDefault();
                  elegir(art);
                }}
                onMouseEnter={() => setActivo(i)}
                className={`flex cursor-pointer items-center gap-3 px-3 py-2 text-sm transition-colors duration-100 ${
                  i === activo ? 'bg-orange-50' : ''
                }`}
              >
                <span className="w-20 shrink-0 truncate font-mono text-xs text-gray-500">{art.codigo}</span>
                <span className="min-w-0 flex-1 truncate text-gray-900">{art.nombre}</span>
                <span className="shrink-0 text-xs text-gray-500">{art.unidad}</span>
                <span className="w-20 shrink-0 text-right tabular-nums text-gray-900">
                  {art.precio !== null ? formatoSoles(art.precio) : <span className="text-gray-400">sin precio</span>}
                </span>
                {art.stock !== null && (
                  <span
                    className={`w-16 shrink-0 rounded-full px-2 py-0.5 text-center text-xs tabular-nums ${
                      sinStock ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {formatoCantidad(art.stock)}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
});

export default ArticuloAutocomplete;
