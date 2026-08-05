import { useCallback, useEffect, useRef, useState } from 'react';

export function useApi(loader, dependencies = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const mountedRef = useRef(true);
  const requestRef = useRef(0);

  useEffect(() => () => {
    mountedRef.current = false;
  }, []);

  const load = useCallback(async () => {
    const requestId = ++requestRef.current;
    if (mountedRef.current) {
      setLoading(true);
      setError('');
    }
    try {
      const resultado = await loader();
      if (mountedRef.current && requestId === requestRef.current) setData(resultado);
      return resultado;
    } catch (err) {
      if (mountedRef.current && requestId === requestRef.current) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'Error inesperado');
      }
      throw err;
    } finally {
      if (mountedRef.current && requestId === requestRef.current) setLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  return { data, loading, error, reload: load };
}
