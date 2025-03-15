// File: /resources/js/Components/ui/SelectWithSearchInDropdown.jsx
import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * items: Array de objetos, e.g. [{ label: 'Opción 1', value: '1' }, ...]
 * value: valor seleccionado (p.e. '1')
 * onChange: función que recibe el value al seleccionar (p.e. onChange('1'))
 * placeholder: texto a mostrar cuando no hay nada seleccionado
 * labelExtractor: cómo extraer el label de un item (por defecto: item.label)
 * valueExtractor: cómo extraer el value de un item (por defecto: item.value)
 */
export default function SelectWithSearchInDropdown({
  items = [],
  value = null,
  onChange = () => {},
  placeholder = 'Seleccione...',
  labelExtractor = (item) => item.label,
  valueExtractor = (item) => item.value,
  width = 'w-60', // tailwind para ancho
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filtered, setFiltered] = useState(items);

  const containerRef = useRef(null);

  // Al cambiar 'items' o 'search', filtramos
  useEffect(() => {
    if (!search.trim()) {
      setFiltered(items);
    } else {
      const lower = search.toLowerCase();
      setFiltered(
        items.filter((it) =>
          labelExtractor(it).toLowerCase().includes(lower)
        )
      );
    }
  }, [search, items, labelExtractor]);

  // Al hacer clic fuera, cerramos el menú
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cuando se selecciona un item
  const handleSelect = (item) => {
    onChange(valueExtractor(item)); // Notificamos al padre
    setOpen(false);
  };

  // Obtener el texto para mostrar en el “label principal” (cuando está cerrado)
  let selectedLabel = placeholder;
  if (value != null) {
    const found = items.find((it) => valueExtractor(it) === value);
    if (found) {
      selectedLabel = labelExtractor(found);
    }
  }

  return (
    <div className={`relative ${width}`} ref={containerRef}>
      {/* Caja "select" principal */}
      <div
        className="border rounded px-3 py-2 flex items-center justify-between bg-white cursor-pointer"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="text-sm text-gray-700">
          {selectedLabel}
        </span>
        <ChevronDown size={16} className="text-gray-500" />
      </div>

      {open && (
        <div className="absolute left-0 right-0 mt-1 bg-white border rounded shadow z-10">
          {/* Input de búsqueda */}
          <div className="p-2 border-b">
            <input
              type="text"
              className="w-full border rounded px-2 py-1 text-sm outline-none focus:ring"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Lista de opciones */}
          <div className="max-h-48 overflow-auto">
            {filtered.length === 0 && (
              <div className="px-3 py-2 text-sm text-gray-500">
                Sin resultados
              </div>
            )}
            {filtered.map((item) => {
              const val = valueExtractor(item);
              const label = labelExtractor(item);
              return (
                <div
                  key={val}
                  className="px-3 py-2 hover:bg-gray-100 text-sm cursor-pointer"
                  onClick={() => handleSelect(item)}
                >
                  {label}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
