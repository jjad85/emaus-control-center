import { useEffect, useMemo, useState } from 'react';
import { seleccionarActividadEnVivo, calcularEjecucion } from '../utils/minutogramaTiempo';

export default function useMinutogramaEnVivo(actividades) {
  const [ahora, setAhora] = useState(new Date());
  useEffect(() => {
    const id = window.setInterval(() => setAhora(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return useMemo(() => {
    const seleccion = seleccionarActividadEnVivo(actividades, ahora);
    return { ...seleccion, ahora, ejecucion: calcularEjecucion(seleccion.actual, ahora) };
  }, [actividades, ahora]);
}
