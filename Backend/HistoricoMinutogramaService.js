/**
 * Histórico y comparación de retiros del minutograma.
 * Mantiene el acceso centralizado mediante obtenerHoja() y leerHojaComoObjetos().
 */

const HOJA_HISTORICO_RETIROS = 'HistoricoRetiros';
const HOJA_HISTORICO_ACTIVIDADES = 'HistoricoMinutograma';

function obtenerHistoricoMinutograma(parametros) {
  const filtros = parametros || {};
  const retiros = leerHojaComoObjetos(HOJA_HISTORICO_RETIROS)
    .filter(function(item) { return convertirBooleano(item.activo); })
    .filter(function(item) {
      return !filtros.retiroId || String(item.retiroId) === String(filtros.retiroId);
    })
    .map(convertirRetiroHistorico_)
    .sort(function(a, b) { return String(b.fechaCierre).localeCompare(String(a.fechaCierre)); });

  if (filtros.retiroId) {
    const actividades = leerHojaComoObjetos(HOJA_HISTORICO_ACTIVIDADES)
      .filter(function(item) { return String(item.retiroId) === String(filtros.retiroId); });
    return { items: retiros, actividades: actividades };
  }
  return { items: retiros };
}

function obtenerComparativoRetiros(parametros) {
  const limite = Math.max(1, Math.min(20, convertirNumero((parametros || {}).limite, 8)));
  const historico = obtenerHistoricoMinutograma({}).items.slice(0, limite);
  return { items: historico, total: historico.length };
}

function cerrarRetiroMinutograma(token, datos) {
  const sesion = validarToken(token);
  validarPermisoMinutograma_(sesion, 'ACTUALIZAR_ESTADO_PASO_A_PASO');

  const entrada = datos || {};
  const nombreRetiro = String(entrada.nombreRetiro || '').trim();
  const fechaRetiro = String(entrada.fechaRetiro || '').trim();
  if (!nombreRetiro) throw crearErrorAplicacion('NOMBRE_REQUERIDO', 'Debes indicar el nombre del retiro.');
  if (!fechaRetiro) throw crearErrorAplicacion('FECHA_REQUERIDA', 'Debes indicar la fecha del retiro.');

  asegurarHojasHistoricoMinutograma_();

  const retiroId = Utilities.getUuid();
  const ahora = new Date();
  const actividades = obtenerMinutograma({});
  const resumen = obtenerResumenMinutograma({});
  const usuario = sesion.correo || sesion.email || sesion.usuario || 'Sistema';

  agregarFilaObjeto_(HOJA_HISTORICO_RETIROS, {
    retiroId: retiroId,
    nombreRetiro: nombreRetiro,
    fechaRetiro: fechaRetiro,
    fechaCierre: ahora,
    totalActividades: resumen.total,
    finalizadas: resumen.finalizadas,
    pendientes: resumen.pendientes,
    canceladas: resumen.canceladas,
    cumplimientoPorcentaje: resumen.cumplimientoPorcentaje,
    puntualidadPorcentaje: resumen.puntualidadPorcentaje,
    minutosProgramados: resumen.minutosProgramados,
    minutosReales: resumen.minutosReales,
    balanceMinutos: resumen.balanceMinutos,
    cerradoPor: usuario,
    activo: true
  });

  actividades.forEach(function(item) {
    agregarFilaObjeto_(HOJA_HISTORICO_ACTIVIDADES, {
      retiroId: retiroId,
      nombreRetiro: nombreRetiro,
      fechaRetiro: fechaRetiro,
      actividadId: item.id,
      dia: item.dia,
      horaInicio: item.horaInicio,
      actividad: item.actividad,
      responsable: item.responsable,
      equipo: item.equipo,
      lugar: item.lugar,
      estado: item.estado,
      duracionMinutos: item.duracionMinutos,
      duracionRealMinutos: item.duracionRealMinutos,
      variacionMinutos: item.variacionMinutos,
      observaciones: item.observaciones,
      fechaCierre: ahora
    });
  });

  if (typeof registrarAuditoria === 'function') {
    registrarAuditoria('MINUTOGRAMA', 'CERRAR_RETIRO', retiroId, usuario, JSON.stringify({ nombreRetiro: nombreRetiro, total: actividades.length }));
  }
  return { retiroId: retiroId, nombreRetiro: nombreRetiro, resumen: resumen, actividadesArchivadas: actividades.length };
}

function convertirRetiroHistorico_(item) {
  return {
    retiroId: item.retiroId,
    nombreRetiro: item.nombreRetiro,
    fechaRetiro: serializarFechaMinutograma(item.fechaRetiro),
    fechaCierre: serializarFechaMinutograma(item.fechaCierre),
    totalActividades: convertirNumero(item.totalActividades, 0),
    finalizadas: convertirNumero(item.finalizadas, 0),
    pendientes: convertirNumero(item.pendientes, 0),
    canceladas: convertirNumero(item.canceladas, 0),
    cumplimientoPorcentaje: convertirNumero(item.cumplimientoPorcentaje, 0),
    puntualidadPorcentaje: convertirNumero(item.puntualidadPorcentaje, 0),
    minutosProgramados: convertirNumero(item.minutosProgramados, 0),
    minutosReales: convertirNumero(item.minutosReales, 0),
    balanceMinutos: convertirNumero(item.balanceMinutos, 0),
    cerradoPor: item.cerradoPor || ''
  };
}

function asegurarHojasHistoricoMinutograma_() {
  asegurarHojaConEncabezados_(HOJA_HISTORICO_RETIROS, [
    'retiroId','nombreRetiro','fechaRetiro','fechaCierre','totalActividades','finalizadas','pendientes','canceladas','cumplimientoPorcentaje','puntualidadPorcentaje','minutosProgramados','minutosReales','balanceMinutos','cerradoPor','activo'
  ]);
  asegurarHojaConEncabezados_(HOJA_HISTORICO_ACTIVIDADES, [
    'retiroId','nombreRetiro','fechaRetiro','actividadId','dia','horaInicio','actividad','responsable','equipo','lugar','estado','duracionMinutos','duracionRealMinutos','variacionMinutos','observaciones','fechaCierre'
  ]);
}

function asegurarHojaConEncabezados_(nombre, encabezados) {
  const libro = obtenerLibro();
  let hoja = libro.getSheetByName(nombre);
  if (!hoja) hoja = libro.insertSheet(nombre);
  if (hoja.getLastRow() === 0) {
    hoja.getRange(1, 1, 1, encabezados.length).setValues([encabezados]);
    hoja.setFrozenRows(1);
    hoja.getRange(1, 1, 1, encabezados.length).setFontWeight('bold');
  }
  return hoja;
}

function agregarFilaObjeto_(nombreHoja, objeto) {
  const hoja = obtenerHoja(nombreHoja);
  const encabezados = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0];
  hoja.appendRow(encabezados.map(function(campo) { return objeto[campo] !== undefined ? objeto[campo] : ''; }));
}
