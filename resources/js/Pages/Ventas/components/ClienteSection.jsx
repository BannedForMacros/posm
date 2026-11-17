// Datos del cliente: al ingresar el DNI/RUC se recuperan sus datos guardados o, si es
// nuevo, se consultan en SUNAT/RENIEC (API DBPeru). Siempre se pueden corregir a mano.
import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Loader2, Search, AlertCircle } from 'lucide-react';
import { Campo } from '@/Pages/ArticuloManage/components/ArticuloForm';
import { FACTURA, errorDocumento, limpiarDocumento, rucValido } from '../utils/venta';

const input =
  'mt-1 block w-full h-10 rounded-lg border px-3 text-gray-900 placeholder:text-gray-400 transition-[border-color,box-shadow] duration-150 focus:outline-none focus:ring-2';
const clase = (err, extra = '') =>
  `${input} ${err ? 'border-red-500 focus:ring-red-500/30' : 'border-gray-300 focus:border-orange-500 focus:ring-orange-500/40'} ${extra}`;

const ClienteSection = ({ codDocumento, cliente, onCambio, errores = {} }) => {
  const [estado, setEstado] = useState({ tipo: 'idle', mensaje: '' }); // idle | buscando | ok | aviso | error
  const ultimoBuscado = useRef('');
  const esFactura = codDocumento === FACTURA;

  const buscar = async (doc) => {
    if (!doc || doc === ultimoBuscado.current) return;
    const error = errorDocumento(doc, codDocumento);
    if (error) {
      setEstado({ tipo: 'error', mensaje: error });
      return;
    }
    ultimoBuscado.current = doc;
    setEstado({ tipo: 'buscando', mensaje: 'Buscando…' });
    try {
      const r = await fetch(`/api/clientes/buscar?documento=${doc}`, { headers: { Accept: 'application/json' } });
      const data = await r.json().catch(() => ({}));
      if (r.ok) {
        const c = data.cliente;
        onCambio({
          cliente_nombre: c.razon_social ?? '',
          cliente_direccion: c.direccion ?? '',
          cliente_fuente: data.fuente,
        });
        const advertencia = c.estado && c.estado !== 'ACTIVO' ? ` · Contribuyente ${c.estado}` : '';
        setEstado({
          tipo: advertencia ? 'aviso' : 'ok',
          mensaje: (data.fuente === 'local' ? 'Cliente registrado' : 'Datos de SUNAT/RENIEC') + advertencia,
        });
      } else {
        onCambio({ cliente_fuente: 'manual' });
        setEstado({ tipo: 'aviso', mensaje: data.message || 'No se encontró. Ingresa los datos manualmente.' });
      }
    } catch {
      setEstado({ tipo: 'aviso', mensaje: 'No se pudo consultar. Ingresa los datos manualmente.' });
    }
  };

  // RUC completo y válido: se busca solo. Un DNI (8 dígitos) se busca tras una pausa,
  // porque 8 dígitos también pueden ser el comienzo de un RUC.
  useEffect(() => {
    const doc = cliente.cliente_documento;
    if (doc.length === 11 && rucValido(doc)) {
      buscar(doc);
      return undefined;
    }
    if (doc.length === 8) {
      const t = setTimeout(() => buscar(doc), 700);
      return () => clearTimeout(t);
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cliente.cliente_documento]);

  const cambiarDocumento = (valor) => {
    const doc = limpiarDocumento(valor);
    if (doc !== cliente.cliente_documento) {
      // Cambió el documento: los datos traídos para el anterior ya no aplican.
      const venianDeBusqueda = ['local', 'consulta'].includes(cliente.cliente_fuente);
      onCambio({
        cliente_documento: doc,
        ...(venianDeBusqueda ? { cliente_nombre: '', cliente_direccion: '', cliente_fuente: 'manual' } : {}),
      });
      ultimoBuscado.current = '';
      setEstado({ tipo: 'idle', mensaje: '' });
    }
  };

  const Icono = { buscando: Loader2, ok: CheckCircle2, aviso: AlertCircle, error: AlertCircle }[estado.tipo];
  const color = { buscando: 'text-gray-500', ok: 'text-green-600', aviso: 'text-amber-600', error: 'text-red-600' }[estado.tipo];

  return (
    <fieldset className="space-y-3">
      <legend className="mb-1 text-sm font-semibold text-gray-800">Cliente</legend>

      <Campo
        label={esFactura ? 'RUC' : 'DNI / RUC'}
        requerido={esFactura}
        error={errores.cliente_documento}
        ayuda={!esFactura ? 'Opcional · Vacío = Clientes varios' : null}
      >
        <div className="relative mt-1">
          <input
            type="text"
            inputMode="numeric"
            className={clase(errores.cliente_documento, 'mt-0 pr-11 font-mono tabular-nums')}
            placeholder={esFactura ? '20XXXXXXXXX' : 'DNI u RUC'}
            value={cliente.cliente_documento}
            maxLength={11}
            onChange={(e) => cambiarDocumento(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                ultimoBuscado.current = '';
                buscar(cliente.cliente_documento);
              }
            }}
          />
          <button
            type="button"
            title="Buscar"
            aria-label="Buscar cliente"
            onClick={() => {
              ultimoBuscado.current = '';
              buscar(cliente.cliente_documento);
            }}
            className="absolute right-1 top-1 flex h-8 w-9 items-center justify-center rounded-md text-gray-500 transition-colors duration-150 hover:bg-gray-100 hover:text-gray-800"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>
      </Campo>
      {estado.tipo !== 'idle' && !errores.cliente_documento && (
        <p className={`-mt-1 flex items-center gap-1.5 text-xs ${color}`} role="status">
          {Icono && <Icono className={`h-3.5 w-3.5 ${estado.tipo === 'buscando' ? 'animate-spin' : ''}`} />}
          {estado.mensaje}
        </p>
      )}

      <Campo label={esFactura ? 'Razón social' : 'Nombre / Razón social'} requerido={esFactura || cliente.cliente_documento !== ''} error={errores.cliente_nombre}>
        <input
          type="text"
          className={clase(errores.cliente_nombre)}
          placeholder={esFactura ? 'Se completa con el RUC' : 'Clientes varios'}
          value={cliente.cliente_nombre}
          maxLength={150}
          onChange={(e) => onCambio({ cliente_nombre: e.target.value })}
        />
      </Campo>

      <Campo label="Dirección" error={errores.cliente_direccion} ayuda="Opcional">
        <input
          type="text"
          className={clase(errores.cliente_direccion)}
          value={cliente.cliente_direccion}
          maxLength={150}
          onChange={(e) => onCambio({ cliente_direccion: e.target.value })}
        />
      </Campo>
    </fieldset>
  );
};

export default ClienteSection;
