import './bootstrap';
import '../css/app.css';

import React from 'react';
import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';


createInertiaApp({
  resolve: (name) => resolvePageComponent(`./Pages/${name}.jsx`, import.meta.glob('./Pages/**/*.jsx')),
  
  setup({ el, App, props }) {
    const root = createRoot(el);
    root.render(<App {...props} />);
  },

  // Aquí forzamos la URL base /posmweb en las rutas generadas
  resolveRoute: (name, params) => {
    // Define el subdirectorio o URL base
    const baseUrl = 'http://localhost:8282/posmweb';
    
    // Suponemos que "route(...)" devuelve algo tipo "/login" o "/dashboard"
    const generatedUrl = route(name, params);

    // Evita duplicar si la ruta ya trae 'posmweb' o si es absoluta
    if (
      generatedUrl.startsWith('http://') || 
      generatedUrl.startsWith('https://') ||
      generatedUrl.includes('/posmweb/')
    ) {
      return generatedUrl;
    }

    // Si empieza con '/', anteponemos el baseUrl
    return generatedUrl.startsWith('/')
      ? `${baseUrl}${generatedUrl}`
      : generatedUrl;
  },
});
