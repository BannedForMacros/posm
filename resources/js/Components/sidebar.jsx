import React, { useState } from 'react';
import { Link } from '@inertiajs/inertia-react';
import { Inertia } from '@inertiajs/inertia';
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  BookOpen,
  ShoppingCart,
  Settings,
  LogOut,
  Boxes,
  FolderTree,
  Monitor,
  Users,
  FileText,
  Home,
  Package, // Para Inventario
  Building2, // Para Sucursales
  Building,  // Para Almacenes
  Factory,   // Para Operaciones
  ClipboardList, // Para Lista de Precios
} from "lucide-react";

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showMantenimiento, setShowMantenimiento] = useState(false);

  // Si necesitas más submenús (ej. para Almacenes, Operaciones, etc.), puedes agregar
  // más flags de estado si quieres controlar su apertura individual.
  const [showInventario, setShowInventario] = useState(false);

  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

  // Definimos los ítems de navegación
  const navItems = [
    {
      icon: <LayoutDashboard size={20} />,
      label: 'Dashboard',
      href: '/dashboard'
    },
    {
      icon: <Monitor size={20} />,
      label: 'Mantenimiento',
      type: 'submenu',
      isOpen: showMantenimiento,
      toggle: () => setShowMantenimiento(!showMantenimiento),
      items: [
        {
          icon: <Boxes size={20} />,
          label: 'Artículos (CRUD)',
          href: '/articulos-manage'
        },
        {
          icon: <FolderTree size={20} />,
          label: 'Familias',
          href: '/familias'
        },
        {
          icon: <Users size={20} />,
          label: 'Proveedores',
          href: '/proveedores'
        },
        {
          icon: <Building2 size={20} />,
          label: 'Sucursales',
          href: '/sucursales'
        },
        {
          icon: <Building size={20} />,
          label: 'Almacenes',
          href: '/almacenes'
        },
        {
          icon: <Factory size={20} />,
          label: 'Operaciones',
          href: '/api/operaciones' // O si creas vista Inertia: '/operaciones'
        },
      ]
    },
    {
      icon: <BookOpen size={20} />,
      label: 'Artículos (Público)',
      href: '/articulos'
    },
    {
      icon: <FileText size={20} />,
      label: 'Compras',
      href: '/facturacion'
    },
    {
      icon: <ShoppingCart size={20} />,
      label: 'Ventas',
      href: '/ventas'
    },
    {
      icon: <ClipboardList size={20} />,
      label: 'Lista de Precios',
      href: '/lista-precios'
    },
    {
      icon: <Package size={20} />,
      label: 'Inventario',
      type: 'submenu',
      isOpen: showInventario,
      toggle: () => setShowInventario(!showInventario),
      items: [
        {
          icon: <Package size={20} />,
          label: 'Inventario Inicial',
          href: '/inventario-inicial'
        },
        {
          icon: <Package size={20} />,
          label: 'Stock Inventario',
          href: '/inventario' // Ajusta si tu vista principal de inventario es /inventario
        },
        {
          icon: <Package size={20} />,
          label: 'Docs. de Almacén',
          href: '/warehouse-documents'
        },
        {
          icon: <Package size={20} />,
          label: 'Movimientos Almacén',
          href: '/warehouse-movements'
        },
      ]
    },
    {
      icon: <Settings size={20} />,
      label: 'Configuración',
      href: '/configuracion'
    },
  ];

  // Función para renderizar un ítem
  const renderNavItem = (item) => {
    // Si es un submenú
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
              <span className={`${isCollapsed ? 'hidden' : 'block'} transition-all duration-300`}>
                {item.label}
              </span>
            </div>
            {!isCollapsed && (
              <ChevronRight
                size={16}
                className={`transition-transform duration-200 ${item.isOpen ? 'rotate-90' : ''}`}
              />
            )}
          </button>

          {item.isOpen && !isCollapsed && (
            <div className="ml-4 space-y-1">
              {item.items.map((subitem) => (
                <Link
                  key={subitem.href}
                  href={subitem.href}
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors duration-200
                    ${currentPath === subitem.href 
                      ? 'bg-orange-600 text-white' 
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                >
                  {subitem.icon}
                  <span className="block">{subitem.label}</span>
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
        className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors duration-200
          ${currentPath === item.href 
            ? 'bg-orange-600 text-white' 
            : 'text-gray-300 hover:bg-gray-800 hover:text-white'
          }`}
      >
        {item.icon}
        <span className={`${isCollapsed ? 'hidden' : 'block'} transition-all duration-300`}>
          {item.label}
        </span>
      </Link>
    );
  };

  return (
    <div className="relative">
      <div className={`
        fixed top-0 left-0 h-full bg-gray-900 text-gray-100 
        transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-20' : 'w-64'}
      `}
      >
        <div className="relative py-5">
          <div className="flex justify-center items-center">
            <h1 className={`font-bold transition-all duration-300 ${isCollapsed ? 'text-sm' : 'text-xl'}`}>
              {isCollapsed ? 'P-M' : 'POS.M'}
            </h1>
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute top-1/2 -right-3 transform -translate-y-1/2
              w-6 h-6 flex items-center justify-center rounded-full
              bg-orange-600 hover:bg-orange-700 text-white transition-all duration-200
              shadow-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        <div className="px-4">
          <div className="h-px bg-gray-800 w-full" />
        </div>

        <nav className="p-4 space-y-2">
          {navItems.map(renderNavItem)}
        </nav>

        <div className="px-4">
          <div className="h-px bg-gray-800 w-full" />
        </div>

        <div className="absolute bottom-4 w-full px-4">
          <button
            onClick={() => Inertia.post(route('logout'))}
            className="w-full px-4 py-2 rounded-lg flex items-center gap-3
              text-gray-300 hover:bg-gray-800 hover:text-white transition-colors duration-200"
          >
            <LogOut size={20} />
            <span className={`${isCollapsed ? 'hidden' : 'block'} transition-all duration-300`}>
              Cerrar Sesión
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
