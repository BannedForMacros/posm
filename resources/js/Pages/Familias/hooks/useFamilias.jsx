// Familias y subfamilias de la empresa activa. Los códigos los asigna el servidor.
import { useCallback, useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { erroresDeServidor } from '@/Pages/ArticuloManage/utils/articulo';

export const toast = (title, icon = 'success') =>
  Swal.fire({ toast: true, position: 'top-end', icon, title, showConfirmButton: false, timer: 2200, timerProgressBar: true });

const enviar = async (url, method, body) => {
  try {
    const r = await fetch(url, {
      method,
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await r.json().catch(() => ({}));
    if (r.ok) return { ok: true, data: data.data, message: data.message };
    return { ok: false, errors: r.status === 422 ? erroresDeServidor(data) : {}, message: data.message || `Error ${r.status}` };
  } catch {
    return { ok: false, errors: {}, message: 'No se pudo conectar con el servidor.' };
  }
};

export const useFamilias = () => {
  const [familias, setFamilias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFamilias = useCallback(async () => {
    setError(null);
    try {
      const r = await fetch('/api/familias', { headers: { Accept: 'application/json' } });
      if (!r.ok) throw new Error('No se pudieron cargar las familias.');
      const data = await r.json();
      setFamilias(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  /** { tipo: 'familia', familia } | { tipo: 'subfamilia', codfamilia_padre, subfamilia } */
  const crearFamilia = async (datos) => {
    const res = await enviar('/api/familias', 'POST', datos);
    if (res.ok) {
      await fetchFamilias();
      toast(res.message);
    }
    return res;
  };

  /** Solo cambia el nombre (familia o subfamilia según el código). */
  const actualizarFamilia = async (codfamilia, datos) => {
    const res = await enviar(`/api/familias/${encodeURIComponent(codfamilia)}`, 'PUT', datos);
    if (res.ok) {
      await fetchFamilias(); // renombrar una familia también cambia sus subfamilias
      toast(res.message);
    }
    return res;
  };

  const eliminarFamilia = async (fila) => {
    const esSub = fila.codfamilia.length === 6;
    const nombre = String(esSub ? fila.subfamilia : fila.familia).replace(/</g, '&lt;');
    const { isConfirmed } = await Swal.fire({
      title: esSub ? '¿Eliminar subfamilia?' : '¿Eliminar familia?',
      html: `Se dará de baja <b>${nombre}</b>.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      focusCancel: true,
    });
    if (!isConfirmed) return;

    const res = await enviar(`/api/familias/${encodeURIComponent(fila.codfamilia)}`, 'DELETE');
    if (res.ok) {
      setFamilias((prev) => prev.filter((f) => f.codfamilia !== fila.codfamilia));
      toast(res.message);
    } else {
      Swal.fire('No se pudo eliminar', res.message, 'warning');
    }
  };

  useEffect(() => {
    fetchFamilias();
  }, [fetchFamilias]);

  return { familias, loading, error, fetchFamilias, crearFamilia, actualizarFamilia, eliminarFamilia };
};
