import React, { useState, useEffect } from 'react';
import { Link, router } from '@inertiajs/react';
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Monitor,
  Boxes,
  FolderTree,
  Users,
  Building2,
  Building,
  Factory,
  FileText,
  ShoppingCart,
  ClipboardList,
  Package,
  Settings,
  LogOut,
} from 'lucide-react';

/**
 * Intenta leer del localStorage el estado del sidebar:
 * - si está colapsado
 * - cuáles submenús están abiertos
 */
function loadSidebarState() {
  try {
    const stored = localStorage.getItem('sidebarState');
    return stored
      ? JSON.parse(stored)
      : { isCollapsed: false, showMantenimiento: false, showInventario: false };
  } catch {
    return { isCollapsed: false, showMantenimiento: false, showInventario: false };
  }
}

export default function Sidebar() {
  // Estado: colapsado/expandido y submenús
  const [sidebarState, setSidebarState] = useState(loadSidebarState);
  const { isCollapsed, showMantenimiento, showInventario } = sidebarState;

  // Guardar cambios en localStorage
  useEffect(() => {
    localStorage.setItem('sidebarState', JSON.stringify(sidebarState));
  }, [sidebarState]);

  // Ruta actual (para resaltar ítem activo)
  const currentPath =
    typeof window !== 'undefined' ? window.location.pathname : '';

  // Alternar colapsar/expandir
  const toggleCollapse = () => {
    setSidebarState((prev) => ({ ...prev, isCollapsed: !prev.isCollapsed }));
  };

  // Lista de navegación
  const navItems = [
    {
      icon: <LayoutDashboard size={20} />,
      label: 'Dashboard',
      href: '/dashboard',
    },
    {
      icon: <Monitor size={20} />,
      label: 'Mantenimiento',
      type: 'submenu',
      isOpen: showMantenimiento,
      toggle: () =>
        setSidebarState((prev) => ({
          ...prev,
          showMantenimiento: !prev.showMantenimiento,
        })),
      items: [
        {
          icon: <Boxes size={20} />,
          label: 'Artículos (CRUD)',
          href: '/articulos-manage',
        },
        {
          icon: <FolderTree size={20} />,
          label: 'Familias',
          href: '/familias',
        },
        {
          icon: <Users size={20} />,
          label: 'Proveedores',
          href: '/proveedores',
        },
        {
          icon: <Building2 size={20} />,
          label: 'Sucursales',
          href: '/sucursales',
        },
        {
          icon: <Building size={20} />,
          label: 'Almacenes',
          href: '/almacenes',
        },

      ],
    },
    {
      icon: <FileText size={20} />,
      label: 'Compras',
      href: '/facturacion',
    },
    {
      icon: <ShoppingCart size={20} />,
      label: 'Ventas',
      href: '/ventas',
    },
    {
      icon: <ClipboardList size={20} />,
      label: 'Lista de Precios',
      href: '/lista-precios',
    },
    {
      icon: <Package size={20} />,
      label: 'Inventario',
      type: 'submenu',
      isOpen: showInventario,
      toggle: () =>
        setSidebarState((prev) => ({
          ...prev,
          showInventario: !prev.showInventario,
        })),
      items: [
        {
          icon: <Package size={20} />,
          label: 'Inventario Inicial',
          href: '/inventario-inicial',
        },
        {
          icon: <Package size={20} />,
          label: 'Stock Inventario',
          href: '/inventario',
        },
        {
          icon: <Package size={20} />,
          label: 'Docs. de Almacén',
          href: '/warehouse-documents',
        },
        {
          icon: <Package size={20} />,
          label: 'Movimientos Almacén',
          href: '/warehouse-movements',
        },
      ],
    },
    {
      icon: <Settings size={20} />,
      label: 'Configuración',
      href: '/configuracion',
    },
  ];

  // Renderizar ítems
  const renderNavItem = (item) => {
    // Submenú
    if (item.type === 'submenu') {
      return (
        <div key={item.label} className="space-y-1">
          <button
            onClick={item.toggle}
            className="w-full flex items-center justify-between px-4 py-2 rounded-lg
              text-gray-300 hover:bg-gray-800 hover:text-white transition-colors duration-200"
          >
            <div className="flex items-center gap-3">
              {item.icon}
              {/* Label (oculto si está colapsado) */}
              <span
                className={`${
                  isCollapsed ? 'hidden' : 'block'
                } transition-all duration-300`}
              >
                {item.label}
              </span>
            </div>
            {/* Flecha que gira si abierto */}
            {!isCollapsed && (
              <ChevronRight
                size={16}
                className={`transition-transform duration-200 ${
                  item.isOpen ? 'rotate-90' : ''
                }`}
              />
            )}
          </button>

          {/* Subítems: se ven solo si submenú está abierto y barra NO está colapsada */}
          {item.isOpen && !isCollapsed && (
            <div className="ml-4 space-y-1">
              {item.items.map((subitem) => (
                <Link
                  key={subitem.href}
                  href={subitem.href}
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors duration-200 ${
                    currentPath === subitem.href
                      ? 'bg-orange-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  {subitem.icon}
                  <span>{subitem.label}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      );
    }

    // Ítem normal
    return (
      <Link
        key={item.href}
        href={item.href}
        className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors duration-200 ${
          currentPath === item.href
            ? 'bg-orange-600 text-white'
            : 'text-gray-300 hover:bg-gray-800 hover:text-white'
        }`}
      >
        {item.icon}
        {/* Label (oculto si colapsado) */}
        <span
          className={`${
            isCollapsed ? 'hidden' : 'block'
          } transition-all duration-300`}
        >
          {item.label}
        </span>
      </Link>
    );
  };

  return (
    <aside
      className={`
        fixed top-0 left-0 h-screen 
        bg-gray-900 text-gray-100
        z-50
        transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-20' : 'w-64'}
      `}
    >
      <div className="flex flex-col h-full">
        {/* Header (logo + botón colapsar) */}
        <div className="flex items-center justify-between px-4 py-5">
          <h1
            className={`font-bold transition-all duration-300 ${
              isCollapsed ? 'text-sm' : 'text-xl'
            }`}
          >
            {isCollapsed ? 'P-M' : 'POS.M'}
          </h1>
          {/* Botón para colapsar/expandir siempre visible */}
          <button onClick={toggleCollapse} className="text-gray-100">
            {isCollapsed ? (
              <ChevronRight size={16} />
            ) : (
              <ChevronLeft size={16} />
            )}
          </button>
        </div>

        <div className="h-px bg-gray-800" />

        {/* Menú principal scrollable */}
        <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-2">
          {navItems.map(renderNavItem)}
        </nav>

        {/* Botón de Cerrar Sesión al final */}
        <div className="px-4 py-4">
          <button
            onClick={() => router.post(route('logout'))}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg 
              transition-colors duration-200 text-gray-300 hover:bg-gray-800 hover:text-white
            "
          >
            <LogOut size={20} />
            <span
              className={`${
                isCollapsed ? 'hidden' : 'block'
              } transition-all duration-300`}
            >
              Cerrar Sesión
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
}
