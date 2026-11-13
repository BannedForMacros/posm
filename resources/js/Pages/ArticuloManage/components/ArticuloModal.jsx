// Modal de crear/editar artículo con validación inline (navegador + servidor).
import React, { useEffect, useState } from 'react';
import Modal from '@/Components/ui/Modal';
import ArticuloForm, { PieFormulario } from './ArticuloForm';
import { guardarArticulo, obtenerCodigoSugerido, validarArticulo } from '../utils/articulo';

const VACIO = {
  codigo: '',
  nombrearticulo: '',
  nombrecorto: '',
  codbarra: '',
  codfamilia: '',
  codsubfamilia: '',
  stockminimo: '',
  stockmaximo: '',
};

const aFormulario = (art) => ({
  ...VACIO,
  ...Object.fromEntries(Object.keys(VACIO).map((k) => [k, art?.[k] ?? ''])),
  // numeric(12,4) llega como "2.0000": se muestra limpio.
  stockminimo: art?.stockminimo != null && Number(art.stockminimo) !== 0 ? String(Number(art.stockminimo)) : '',
  stockmaximo: art?.stockmaximo != null && Number(art.stockmaximo) !== 0 ? String(Number(art.stockmaximo)) : '',
  estado: art?.estado ?? 1,
});

/**
 * @param articulo  null = crear; objeto = editar
 * @param inicial   valores iniciales al crear (p. ej. nombre escrito en un buscador)
 * @param onGuardado (articuloGuardado, mensaje) => void
 */
const ArticuloModal = ({ isOpen, onClose, articulo = null, inicial = null, familias, cargandoFamilias, onGuardado }) => {
  const editando = Boolean(articulo);
  const [valores, setValores] = useState(VACIO);
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [sugerido, setSugerido] = useState('');
  const [errorGeneral, setErrorGeneral] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setValores(editando ? aFormulario(articulo) : { ...VACIO, ...(inicial ?? {}) });
    setErrores({});
    setErrorGeneral('');
    setSugerido('');
    if (!editando) obtenerCodigoSugerido().then(setSugerido);
    // Solo al abrir (o cambiar de artículo): `inicial` suele ser un objeto nuevo en cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, articulo]);

  const onCambio = (campo, valor) => {
    setValores((prev) => ({ ...prev, [campo]: valor }));
    // El error de un campo desaparece en cuanto se corrige.
    setErrores((prev) => (prev[campo] ? { ...prev, [campo]: undefined } : prev));
  };

  const guardar = async (e) => {
    e?.preventDefault();
    if (guardando) return;
    const locales = validarArticulo(valores);
    if (Object.keys(locales).length) {
      setErrores(locales);
      return;
    }
    setGuardando(true);
    setErrorGeneral('');
    const res = await guardarArticulo(valores, { id: editando ? articulo.codarticulo : undefined });
    setGuardando(false);

    if (res.ok) {
      onGuardado?.(res.data, res.message);
      return;
    }
    setErrores(res.errors ?? {});
    if (!res.errors || Object.keys(res.errors).length === 0) setErrorGeneral(res.message);
  };

  return (
    <Modal isOpen={isOpen} onClose={guardando ? () => {} : onClose} title={editando ? 'Editar artículo' : 'Nuevo artículo'}>
      <form onSubmit={guardar} noValidate className="p-1">
        {errorGeneral && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {errorGeneral}
          </div>
        )}
        <ArticuloForm
          valores={valores}
          onCambio={onCambio}
          errores={errores}
          familias={familias}
          cargandoFamilias={cargandoFamilias}
          codigoSugerido={sugerido}
          modo={editando ? 'editar' : 'crear'}
        />
        <PieFormulario
          onCancelar={onClose}
          onGuardar={guardar}
          guardando={guardando}
          textoGuardar={editando ? 'Guardar cambios' : 'Crear artículo'}
        />
      </form>
    </Modal>
  );
};

export default ArticuloModal;
