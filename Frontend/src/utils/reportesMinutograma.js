export function numero(valor, defecto = 0) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : defecto;
}

export function porcentaje(valor) {
  return `${numero(valor).toFixed(1)}%`;
}

export function minutosTexto(valor) {
  const n = Math.round(numero(valor));
  const signo = n > 0 ? '+' : '';
  return `${signo}${n} min`;
}

export function descargarCsv(nombreArchivo, filas) {
  if (!Array.isArray(filas) || filas.length === 0) return false;
  const encabezados = Array.from(new Set(filas.flatMap((fila) => Object.keys(fila))));
  const escapar = (valor) => `"${String(valor ?? '').replace(/"/g, '""')}"`;
  const contenido = [
    encabezados.map(escapar).join(','),
    ...filas.map((fila) => encabezados.map((campo) => escapar(fila[campo])).join(',')),
  ].join('\n');
  const blob = new Blob(['\ufeff', contenido], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
  return true;
}

export function construirRecomendaciones(resumen, actividades = []) {
  const recomendaciones = [];
  const puntualidad = numero(resumen?.puntualidadPorcentaje);
  const cumplimiento = numero(resumen?.cumplimientoPorcentaje);
  const retrasadas = actividades.filter((a) => numero(a.variacionMinutos) < 0);

  if (puntualidad < 80) {
    recomendaciones.push({
      nivel: puntualidad < 60 ? 'Alta' : 'Media',
      titulo: 'Ajustar estimaciones de duración',
      detalle: `La puntualidad está en ${puntualidad.toFixed(1)}%. Conviene ampliar el tiempo de las actividades con retrasos repetidos.`,
    });
  }
  if (cumplimiento < 90) {
    recomendaciones.push({
      nivel: cumplimiento < 70 ? 'Alta' : 'Media',
      titulo: 'Revisar actividades no finalizadas',
      detalle: `El cumplimiento está en ${cumplimiento.toFixed(1)}%. Se recomienda identificar bloqueos operativos antes del cierre del retiro.`,
    });
  }
  const porEquipo = retrasadas.reduce((acc, item) => {
    const equipo = item.equipo || 'Sin equipo';
    acc[equipo] = (acc[equipo] || 0) + Math.abs(numero(item.variacionMinutos));
    return acc;
  }, {});
  const equipoCritico = Object.entries(porEquipo).sort((a, b) => b[1] - a[1])[0];
  if (equipoCritico) {
    recomendaciones.push({
      nivel: 'Media',
      titulo: `Acompañar al equipo ${equipoCritico[0]}`,
      detalle: `Acumula aproximadamente ${Math.round(equipoCritico[1])} minutos de retraso. Revisar logística, transiciones y recursos.`,
    });
  }
  if (recomendaciones.length === 0) {
    recomendaciones.push({
      nivel: 'Baja',
      titulo: 'Mantener el esquema operativo',
      detalle: 'Los indicadores actuales son estables. Documentar las prácticas que permitieron cumplir el paso a paso.',
    });
  }
  return recomendaciones;
}
