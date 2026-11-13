import axios from 'axios';
import { router } from '@inertiajs/react';
window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

/*
 * Token CSRF siempre vigente.
 *
 * Laravel regenera el token al iniciar/cerrar sesión, pero con Inertia esas
 * navegaciones no recargan el HTML: el <meta name="csrf-token"> quedaba con el
 * token anterior y todo fetch() de escritura fallaba con "CSRF token mismatch"
 * (419) hasta refrescar la página.
 *
 * 1) Tras cada visita Inertia se copia el token compartido (props.csrf_token)
 *    al <meta>.
 * 2) fetch() de escritura same-origin usa el token del <meta> en el momento del
 *    envío, aunque el componente haya leído uno viejo al montarse.
 */
const csrfMeta = () => document.querySelector('meta[name="csrf-token"]');

export const getCsrfToken = () => csrfMeta()?.getAttribute('content') || '';

const syncCsrfToken = (token) => {
  const meta = csrfMeta();
  if (token && meta && meta.getAttribute('content') !== token) {
    meta.setAttribute('content', token);
  }
};

router.on('navigate', (event) => syncCsrfToken(event.detail.page?.props?.csrf_token));
router.on('success', (event) => syncCsrfToken(event.detail.page?.props?.csrf_token));

const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];
const nativeFetch = window.fetch.bind(window);

window.fetch = (input, init = {}) => {
  try {
    const method = (init.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();
    const url = new URL(input instanceof Request ? input.url : String(input), window.location.href);

    if (!SAFE_METHODS.includes(method) && url.origin === window.location.origin) {
      const token = getCsrfToken();
      if (token) {
        const headers = new Headers(init.headers || (input instanceof Request ? input.headers : undefined));
        headers.set('X-CSRF-TOKEN', token);
        init = { ...init, headers };
      }
    }
  } catch {
    // Si algo falla al inspeccionar la petición, se envía tal cual.
  }
  return nativeFetch(input, init);
};
