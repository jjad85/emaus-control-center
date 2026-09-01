import { useCallback, useEffect, useRef, useState } from 'react';

const EVENTO_DATOS_CAMBIARON = 'emaus:data-changed';
const RETARDO_REFRESCO_MUTACION_MS = 80;

export function useApi(loader, dependencies = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const mountedRef = useRef(true);
  const requestRef = useRef(0);
  const refrescoPendienteRef = useRef(null);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      if (refrescoPendienteRef.current) {
        window.clearTimeout(refrescoPendienteRef.current);
        refrescoPendienteRef.current = null;
      }
    };
  }, []);

  const load = useCallback(async (options = {}) => {
    const silencioso = options.silencioso === true;
    const requestId = ++requestRef.current;

    if (mountedRef.current) {
      if (!silencioso) {
        setLoading(true);
      }
      setError('');
    }

    try {
      const resultado = await loader();

      if (
        mountedRef.current &&
        requestId === requestRef.current
      ) {
        setData(resultado);
      }

      return resultado;
    } catch (err) {
      if (
        mountedRef.current &&
        requestId === requestRef.current
      ) {
        console.error(err);
        setError(
          err instanceof Error
            ? err.message
            : 'Error inesperado'
        );
      }

      throw err;
    } finally {
      if (
        !silencioso &&
        mountedRef.current &&
        requestId === requestRef.current
      ) {
        setLoading(false);
      }
    }
  }, dependencies);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    function refrescarDespuesDeMutacion() {
      if (!mountedRef.current) return;

      if (refrescoPendienteRef.current) {
        window.clearTimeout(refrescoPendienteRef.current);
      }

      refrescoPendienteRef.current = window.setTimeout(() => {
        refrescoPendienteRef.current = null;

        if (!mountedRef.current) return;

        load({
          silencioso: true,
        }).catch(() => {});
      }, RETARDO_REFRESCO_MUTACION_MS);
    }

    window.addEventListener(
      EVENTO_DATOS_CAMBIARON,
      refrescarDespuesDeMutacion
    );

    return () => {
      window.removeEventListener(
        EVENTO_DATOS_CAMBIARON,
        refrescarDespuesDeMutacion
      );

      if (refrescoPendienteRef.current) {
        window.clearTimeout(refrescoPendienteRef.current);
        refrescoPendienteRef.current = null;
      }
    };
  }, [load]);

  return {
    data,
    loading,
    error,
    reload: load,
    setData,
  };
}
