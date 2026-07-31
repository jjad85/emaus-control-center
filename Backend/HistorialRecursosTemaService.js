/**
 * ENTREGA 4 - Historial y reporte consolidado de recursos de los temas.
 */
const HOJA_HISTORIAL_RECURSOS_TEMA = 'HistorialRecursosTema';
const PERMISO_CONSULTAR_HISTORIAL_RECURSOS = 'CONSULTAR_HISTORIAL_RECURSOS';
const PERMISO_REPORTES_RECURSOS_TEMA = 'REPORTES_RECURSOS_TEMA';

function asegurarHojaHistorialRecursosTema_() {
  const libro = obtenerLibro();
  let hoja = libro.getSheetByName(HOJA_HISTORIAL_RECURSOS_TEMA);
  if (!hoja) hoja = libro.insertSheet(HOJA_HISTORIAL_RECURSOS_TEMA);
  if (hoja.getLastRow() === 0) {
    hoja.appendRow([
      'Id','TemaId','TemaNombre','TipoRecurso','EstadoAnterior','EstadoNuevo',
      'Observaciones','ArchivoNombre','Usuario','NombreUsuario','Fecha','Detalle'
    ]);
    hoja.setFrozenRows(1);
  }
  return hoja;
}

function registrarHistorialRecursoTema_(datos) {
  const entrada = datos || {};
  if (!entrada.temaId || !entrada.tipoRecurso) return;
  const hoja = asegurarHojaHistorialRecursosTema_();
  hoja.appendRow([
    Utilities.getUuid(),
    String(entrada.temaId || ''),
    String(entrada.temaNombre || ''),
    String(entrada.tipoRecurso || '').toUpperCase(),
    String(entrada.estadoAnterior || ''),
    String(entrada.estadoNuevo || ''),
    String(entrada.observaciones || ''),
    String(entrada.archivoNombre || ''),
    String(entrada.usuario || ''),
    String(entrada.nombreUsuario || ''),
    entrada.fecha || new Date(),
    JSON.stringify(entrada.detalle || {})
  ]);
}

function obtenerHistorialRecursoTema(token, temaId, tipoRecurso) {
  validarAccesoHistorialRecursos_(token);
  asegurarHojaHistorialRecursosTema_();
  const tema = String(temaId || '').trim();
  const tipo = String(tipoRecurso || '').trim().toUpperCase();
  if (!tema || !tipo) throw crearErrorAplicacion('RECURSO_REQUERIDO', 'Debe indicar el tema y el tipo de recurso.');
  return leerHojaComoObjetos(HOJA_HISTORIAL_RECURSOS_TEMA)
    .filter(function(x) {
      return String(x.temaId || '') === tema && String(x.tipoRecurso || '').toUpperCase() === tipo;
    })
    .map(function(x) {
      let detalle = {};
      try { detalle = x.detalle ? JSON.parse(x.detalle) : {}; } catch (error) {}
      return {
        id: x.id || '', temaId: x.temaId || '', temaNombre: x.temaNombre || '',
        tipoRecurso: x.tipoRecurso || '', estadoAnterior: x.estadoAnterior || '',
        estadoNuevo: x.estadoNuevo || '', observaciones: x.observaciones || '',
        archivoNombre: x.archivoNombre || '', usuario: x.usuario || '',
        nombreUsuario: x.nombreUsuario || '', fecha: x.fecha || '', detalle: detalle
      };
    })
    .sort(function(a, b) { return new Date(b.fecha).getTime() - new Date(a.fecha).getTime(); });
}

function obtenerReporteRecursosTema(token, filtros) {
  validarAccesoReporteRecursos_(token);
  const entrada = filtros || {};
  const tipoFiltro = String(entrada.tipo || '').trim().toUpperCase();
  const estadoFiltro = normalizarTexto(entrada.estado || '');
  const temas = listarRegistrosSheet(HOJAS.TEMAS, {}, opcionesCrudTemas(''))
    .filter(function(x) { return convertirBooleano(x.activo); });
  const items = [];
  temas.forEach(function(registro) {
    const tema = convertirTema(registro);
    if (normalizarSiNoPendienteTema_(tema.requiereMusica) === 'Sí') items.push(construirFilaReporteRecurso_(tema, 'CANCION'));
    if (tema.usaVideo === true) items.push(construirFilaReporteRecurso_(tema, 'VIDEO'));
    if (convertirBooleano(registro.requierePalanca)) items.push(construirFilaReporteRecurso_(tema, 'PALANCA'));
    if (normalizarSiNoPendienteTema_(tema.requierePresentacion) === 'Sí') items.push(construirFilaReporteRecurso_(tema, 'PRESENTACION'));
  });
  const filtrados = items.filter(function(x) {
    if (tipoFiltro && x.tipo !== tipoFiltro) return false;
    if (estadoFiltro && normalizarTexto(x.estado) !== estadoFiltro) return false;
    return true;
  });
  const resumen = { total: filtrados.length, pendientes: 0, requierenAjuste: 0, aprobados: 0, entregados: 0 };
  filtrados.forEach(function(x) {
    const estado = normalizarTexto(x.estado);
    if (estado.indexOf('ajuste') >= 0) resumen.requierenAjuste++;
    else if (estado.indexOf('aprob') >= 0) resumen.aprobados++;
    else if (estado.indexOf('entregad') >= 0) resumen.entregados++;
    else resumen.pendientes++;
  });
  return { items: filtrados, resumen: resumen, generadoEn: new Date() };
}

function construirFilaReporteRecurso_(tema, tipo) {
  if (tipo === 'CANCION' || tipo === 'VIDEO') {
    const item = construirRecursoAudiovisual_(tema, tipo);
    return { temaId: tema.id, temaNombre: tema.nombre, responsable: tema.servidorNombre || '', tipo: tipo, nombre: item.nombre || '', origen: item.origen || '', estado: item.estado || '', aprobador: item.aprobadoPor || '', fechaAprobacion: item.fechaAprobacion || '', observaciones: item.observacionesAudiovisuales || item.observacionesResponsable || '' };
  }
  if (tipo === 'PALANCA') {
    const p = convertirPalancaLogistica_(tema);
    return { temaId: tema.id, temaNombre: tema.nombre, responsable: tema.servidorNombre || '', tipo: tipo, nombre: p.nombre || '', origen: 'PERSONALIZADO', estado: p.estado || '', aprobador: p.aprobadaPor || '', fechaAprobacion: p.fechaAprobacion || '', observaciones: p.observacionesLogistica || p.observacionesResponsable || '' };
  }
  return { temaId: tema.id, temaNombre: tema.nombre, responsable: tema.servidorNombre || '', tipo: tipo, nombre: tema.presentacionArchivoNombre || 'Presentación', origen: 'PERSONALIZADO', estado: tema.estadoPreparacion || 'Pendiente', aprobador: '', fechaAprobacion: '', observaciones: tema.notaAudiovisuales || '' };
}

function validarAccesoHistorialRecursos_(token) {
  try { return validarPermiso(token, PERMISO_CONSULTAR_HISTORIAL_RECURSOS); } catch (error) {}
  try { return validarPermiso(token, 'GESTIONAR_PRESENTACIONES'); } catch (error2) {}
  return validarPermisoPalancasLogistica_(token);
}

function validarAccesoReporteRecursos_(token) {
  try { return validarPermiso(token, PERMISO_REPORTES_RECURSOS_TEMA); } catch (error) {}
  try { return validarPermiso(token, 'GESTIONAR_PRESENTACIONES'); } catch (error2) {}
  return validarPermisoPalancasLogistica_(token);
}
