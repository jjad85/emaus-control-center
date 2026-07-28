/**
 * ============================================================
 * TEMAS SERVICE
 * ============================================================
 * Administración y asignación de temas agrupados por día.
 * El módulo no maneja orden manual ni automático.
 */

const PERMISO_VER_TEMAS = 'TEMAS_VER_DETALLE';
const PERMISO_CREAR_TEMAS = 'TEMAS_CREAR';
const PERMISO_EDITAR_TEMAS = 'TEMAS_EDITAR';
const PERMISO_DESACTIVAR_TEMAS = 'TEMAS_DESACTIVAR';

function obtenerTemas(token, filtros) {
  validarPermiso(token, PERMISO_VER_TEMAS);

  const parametros = filtros || {};
  const incluirInactivos = convertirBooleano(parametros.incluirInactivos);
  const items = listarRegistrosSheet(HOJAS.TEMAS, {}, opcionesCrudTemas(''))
    .map(convertirTema)
    .filter(function(item) {
      if (!incluirInactivos && !item.activo) return false;
      return coincideTexto(item.nombre, parametros.nombre);
    });

  ordenarTemasPorDiaYHora_(items);

  return {
    items: items,
    servidores: obtenerServidoresVigentesParaTemas_(),
    dias: obtenerDiasTema_(items),
    documentos: obtenerDocumentosTemasRF08_()
  };
}

function registrarTema(token, datos) {
  const sesion = validarPermiso(token, PERMISO_CREAR_TEMAS);

  return ejecutarCrudConBloqueo(function() {
    const registro = prepararTema_(datos);
    validarTema_(registro);
    validarNombreTemaUnico_(registro.nombre, null);

    registro.estadoPreparacion = calcularEstadoPreparacionTema_(registro);
    registro.aprobacionConferencista = 'No';
    registro.aprobacionAudiovisuales = 'No';

    const creado = crearRegistroSheet(HOJAS.TEMAS, registro, opcionesCrudTemas(sesion.usuario));
    auditarTema_(sesion, 'REGISTRAR_TEMA', creado.id, creado);
    return convertirTema(leerRegistroPorIdSheet(HOJAS.TEMAS, creado.id, opcionesCrudTemas('')));
  });
}

function editarTema(token, id, datos) {
  const sesion = validarPermiso(token, PERMISO_EDITAR_TEMAS);

  return ejecutarCrudConBloqueo(function() {
    const temaId = String(id || '').trim();
    if (!temaId) {
      throw crearErrorAplicacion('ID_TEMA_REQUERIDO', 'No se recibió el identificador del tema que se desea editar.');
    }

    const anterior = leerRegistroPorIdSheet(HOJAS.TEMAS, temaId, opcionesCrudTemas(sesion.usuario));
    const registro = prepararTema_(datos);
    validarTema_(registro);
    validarNombreTemaUnico_(registro.nombre, temaId);
    registro.estadoPreparacion = calcularEstadoPreparacionTema_(Object.assign({}, anterior, registro));

    const actualizado = actualizarRegistroSheet(
      HOJAS.TEMAS,
      temaId,
      registro,
      opcionesCrudTemas(sesion.usuario)
    );

    // Elimina duplicados históricos del mismo tema sin alterar la fila editada.
    depurarDuplicadosTema_(temaId, actualizado.nombre);

    const resultado = leerRegistroPorIdSheet(HOJAS.TEMAS, temaId, opcionesCrudTemas(''));
    auditarTema_(sesion, 'EDITAR_TEMA', temaId, { anterior: anterior, nuevo: resultado });
    return convertirTema(resultado);
  });
}

function cambiarEstadoTema(token, id, activo) {
  const sesion = validarPermiso(token, PERMISO_DESACTIVAR_TEMAS);

  return ejecutarCrudConBloqueo(function() {
    const activar = convertirBooleano(activo);
    const actualizado = actualizarRegistroSheet(
      HOJAS.TEMAS,
      id,
      { activo: activar ? 'Sí' : 'No' },
      opcionesCrudTemas(sesion.usuario)
    );

    auditarTema_(sesion, activar ? 'ACTIVAR_TEMA' : 'DESACTIVAR_TEMA', id, actualizado);
    return convertirTema(leerRegistroPorIdSheet(HOJAS.TEMAS, id, opcionesCrudTemas('')));
  });
}

function convertirTema(registro) {
  return {
    id: registro.id || '',
    nombre: registro.nombre || '',
    descripcion: registro.descripcion || '',
    duracionMinutos: numeroSeguroTema_(registro.duracionMinutos) || '',
    diaDelTema: registro.diaDelTema || 'Sin definir',
    horaPropuesta: formatearHoraTema_(registro.horaPropuesta),
    servidorId: registro.servidorId || '',
    servidorNombre: registro.servidorNombre || '',
    requierePresentacion: normalizarSiNoPendienteTema_(registro.requierePresentacion),
    requiereTestimonio: convertirBooleano(registro.requiereTestimonio),
    requiereMusica: normalizarSiNoPendienteTema_(registro.requiereMusica),
    tieneCancionEstandar: convertirBooleano(registro.tieneCancionEstandar),
    cancionDocumentoId: registro.cancionDocumentoId || '',
    cancionDocumentoNombre: registro.cancionDocumentoNombre || '',
    usaCancionEstandar: registro.usaCancionEstandar === '' || registro.usaCancionEstandar === undefined ? convertirBooleano(registro.tieneCancionEstandar) : convertirBooleano(registro.usaCancionEstandar),
    tieneVideoEstandar: convertirBooleano(registro.tieneVideoEstandar),
    videoDocumentoId: registro.videoDocumentoId || '',
    videoDocumentoNombre: registro.videoDocumentoNombre || '',
    usaVideoEstandar: registro.usaVideoEstandar === '' || registro.usaVideoEstandar === undefined ? convertirBooleano(registro.tieneVideoEstandar) : convertirBooleano(registro.usaVideoEstandar),
    requierePalanca: convertirBooleano(registro.requierePalanca),
    palancaNombre: registro.palancaNombre || '',
    palancaInstrucciones: registro.palancaInstrucciones || '',
    palancaEstado: registro.palancaEstado || (convertirBooleano(registro.requierePalanca) ? 'Pendiente' : ''),
    palancaAprobadaLogisticaPor: registro.palancaAprobadaLogisticaPor || '',
    palancaFechaAprobacionLogistica: registro.palancaFechaAprobacionLogistica || '',
    estadoPreparacion: registro.estadoPreparacion || 'Pendiente definir presentación',
    aprobacionConferencista: convertirBooleano(registro.aprobacionConferencista),
    aprobacionAudiovisuales: convertirBooleano(registro.aprobacionAudiovisuales),
    versionAprobadaId: registro.versionAprobadaId || '',
    carpetaDriveId: registro.carpetaDriveId || '',
    carpetaDriveUrl: registro.carpetaDriveUrl || '',
    observaciones: registro.observaciones || '',
    activo: convertirBooleano(registro.activo),
    fechaRegistro: registro.fechaRegistro || '',
    fechaActualizacion: registro.fechaActualizacion || '',
    actualizadoPor: registro.actualizadoPor || ''
  };
}

function prepararTema_(datos) {
  const entrada = datos || {};
  const servidorId = String(entrada.servidorId || '').trim();
  const servidor = obtenerServidoresVigentesParaTemas_().find(function(item) {
    return String(item.id) === servidorId;
  });

  const documentos = obtenerDocumentosTemasRF08_();
  const cancion = documentos.find(function(item) { return String(item.id) === String(entrada.cancionDocumentoId || ''); });
  const video = documentos.find(function(item) { return String(item.id) === String(entrada.videoDocumentoId || ''); });

  return {
    nombre: String(entrada.nombre || '').trim(),
    descripcion: String(entrada.descripcion || '').trim(),
    duracionMinutos: entrada.duracionMinutos === '' || entrada.duracionMinutos === null ? '' : Number(entrada.duracionMinutos),
    diaDelTema: String(entrada.diaDelTema || 'Sin definir').trim() || 'Sin definir',
    horaPropuesta: String(entrada.horaPropuesta || '').trim(),
    servidorId: servidorId,
    servidorNombre: servidor ? servidor.nombre : '',
    requierePresentacion: normalizarSiNoPendienteTema_(entrada.requierePresentacion),
    requiereTestimonio: convertirBooleano(entrada.requiereTestimonio) ? 'Sí' : 'No',
    requiereMusica: normalizarSiNoPendienteTema_(entrada.requiereMusica),
    tieneCancionEstandar: convertirBooleano(entrada.tieneCancionEstandar) ? 'Sí' : 'No',
    cancionDocumentoId: convertirBooleano(entrada.tieneCancionEstandar) ? String(entrada.cancionDocumentoId || '').trim() : '',
    cancionDocumentoNombre: convertirBooleano(entrada.tieneCancionEstandar) && cancion ? cancion.nombre : '',
    usaCancionEstandar: convertirBooleano(entrada.tieneCancionEstandar) ? (entrada.usaCancionEstandar === false ? 'No' : 'Sí') : 'No',
    tieneVideoEstandar: convertirBooleano(entrada.tieneVideoEstandar) ? 'Sí' : 'No',
    videoDocumentoId: convertirBooleano(entrada.tieneVideoEstandar) ? String(entrada.videoDocumentoId || '').trim() : '',
    videoDocumentoNombre: convertirBooleano(entrada.tieneVideoEstandar) && video ? video.nombre : '',
    usaVideoEstandar: convertirBooleano(entrada.tieneVideoEstandar) ? (entrada.usaVideoEstandar === false ? 'No' : 'Sí') : 'No',
    requierePalanca: convertirBooleano(entrada.requierePalanca) ? 'Sí' : 'No',
    palancaNombre: convertirBooleano(entrada.requierePalanca) ? String(entrada.palancaNombre || '').trim() : '',
    palancaInstrucciones: convertirBooleano(entrada.requierePalanca) ? String(entrada.palancaInstrucciones || '').trim() : '',
    palancaEstado: convertirBooleano(entrada.requierePalanca) ? String(entrada.palancaEstado || 'Pendiente').trim() : '',
    observaciones: String(entrada.observaciones || '').trim()
  };
}

function validarTema_(tema) {
  if (!tema.nombre) throw crearErrorAplicacion('NOMBRE_TEMA_REQUERIDO', 'El nombre del tema es obligatorio.');
  if (tema.duracionMinutos !== '' && (!isFinite(tema.duracionMinutos) || Number(tema.duracionMinutos) <= 0)) {
    throw crearErrorAplicacion('DURACION_TEMA_INVALIDA', 'La duración debe ser un número mayor que cero.');
  }
  if (tema.tieneCancionEstandar === 'Sí' && !tema.cancionDocumentoId) throw crearErrorAplicacion('CANCION_ESTANDAR_REQUERIDA', 'Seleccione la canción estándar desde Documentos.');
  if (tema.tieneVideoEstandar === 'Sí' && !tema.videoDocumentoId) throw crearErrorAplicacion('VIDEO_ESTANDAR_REQUERIDO', 'Seleccione el video estándar desde Documentos.');
  if (tema.requierePalanca === 'Sí' && (!tema.palancaNombre || !tema.palancaInstrucciones)) throw crearErrorAplicacion('PALANCA_DATOS_REQUERIDOS', 'El nombre y las instrucciones de la palanca son obligatorios.');
  if (tema.servidorId && !tema.servidorNombre) {
    throw crearErrorAplicacion('SERVIDOR_TEMA_NO_VIGENTE', 'El servidor seleccionado no existe o no está vigente.');
  }
}

function validarNombreTemaUnico_(nombre, idExcluir) {
  const duplicado = listarRegistrosSheet(HOJAS.TEMAS, {}, opcionesCrudTemas('')).find(function(item) {
    return convertirBooleano(item.activo) &&
      normalizarTexto(item.nombre) === normalizarTexto(nombre) &&
      String(item.id) !== String(idExcluir || '');
  });
  if (duplicado) throw crearErrorAplicacion('TEMA_DUPLICADO', 'Ya existe un tema activo con ese nombre.');
}

function obtenerServidoresVigentesParaTemas_() {
  return leerHojaComoObjetos(HOJAS.SERVIDORES)
    .filter(function(registro) {
      return registro.activo === undefined || registro.activo === '' || convertirBooleano(registro.activo);
    })
    .map(convertirServidor)
    .filter(function(item) {
      return String(item.id || '').trim() && String(item.nombre || '').trim();
    })
    .map(function(item) {
      return { id: item.id, nombre: item.nombre };
    })
    .sort(function(a, b) {
      return String(a.nombre).localeCompare(String(b.nombre), 'es', { sensitivity: 'base' });
    });
}

function ordenarTemasPorDiaYHora_(items) {
  const prioridad = {
    viernes: 1,
    sabado: 2,
    domingo: 3,
    'sin definir': 99
  };

  items.sort(function(a, b) {
    if (a.activo !== b.activo) return a.activo ? -1 : 1;

    const diaA = normalizarTexto(a.diaDelTema || 'Sin definir');
    const diaB = normalizarTexto(b.diaDelTema || 'Sin definir');
    const diferenciaDia = (prioridad[diaA] || 50) - (prioridad[diaB] || 50);
    if (diferenciaDia) return diferenciaDia;

    const horaA = String(a.horaPropuesta || '99:99');
    const horaB = String(b.horaPropuesta || '99:99');
    return horaA.localeCompare(horaB) || String(a.nombre || '').localeCompare(String(b.nombre || ''), 'es');
  });
}

function obtenerDiasTema_(items) {
  const base = ['Viernes', 'Sábado', 'Domingo', 'Sin definir'];
  items.forEach(function(item) {
    if (item.diaDelTema && base.indexOf(item.diaDelTema) < 0) base.push(item.diaDelTema);
  });
  return base;
}

function calcularEstadoPreparacionTema_(tema) {
  const presentacion = normalizarSiNoPendienteTema_(tema.requierePresentacion);
  const tieneServidor = Boolean(
    String(tema.servidorId || '').trim() ||
    String(tema.servidorNombre || '').trim()
  );

  if (!tieneServidor) return 'Pendiente asignar servidor';
  if (presentacion === 'Pendiente') return 'Pendiente definir presentación';
  if (presentacion === 'No') return 'Tema configurado';
  return 'Pendiente cargar presentación';
}

/**
 * Elimina filas duplicadas históricas del mismo tema.
 * Conserva la primera fila que coincide con el ID editado y elimina las demás
 * coincidencias por ID o por nombre normalizado.
 */
function depurarDuplicadosTema_(temaId, nombreTema) {
  const hoja = obtenerHoja(HOJAS.TEMAS);
  const ultimaFila = hoja.getLastRow();
  const ultimaColumna = hoja.getLastColumn();
  if (ultimaFila < 3 || ultimaColumna < 1) return;

  const encabezados = hoja.getRange(1, 1, 1, ultimaColumna).getDisplayValues()[0];
  const propiedades = encabezados.map(function(encabezado) {
    return convertirEncabezadoCrud(encabezado);
  });
  const indiceId = propiedades.indexOf('id');
  const indiceNombre = propiedades.indexOf('nombre');
  if (indiceId < 0 || indiceNombre < 0) return;

  const valores = hoja.getRange(2, 1, ultimaFila - 1, ultimaColumna).getDisplayValues();
  const idBuscado = String(temaId || '').trim();
  const nombreBuscado = normalizarTexto(nombreTema || '');
  let filaConservada = null;
  const filasEliminar = [];

  valores.forEach(function(fila, indice) {
    const numeroFila = indice + 2;
    const mismoId = String(fila[indiceId] || '').trim() === idBuscado;
    const mismoNombre = nombreBuscado && normalizarTexto(fila[indiceNombre] || '') === nombreBuscado;
    if (!mismoId && !mismoNombre) return;

    if (filaConservada === null) {
      filaConservada = numeroFila;
      return;
    }

    filasEliminar.push(numeroFila);
  });

  filasEliminar.sort(function(a, b) { return b - a; }).forEach(function(numeroFila) {
    hoja.deleteRow(numeroFila);
  });
}

function normalizarSiNoPendienteTema_(valor) {
  const texto = normalizarTexto(valor);
  if (texto === 'si' || texto === 'sí' || valor === true) return 'Sí';
  if (texto === 'no' || valor === false) return 'No';
  return 'Pendiente';
}

function formatearHoraTema_(valor) {
  if (!valor) return '';
  if (Object.prototype.toString.call(valor) === '[object Date]') {
    return Utilities.formatDate(valor, Session.getScriptTimeZone(), 'HH:mm');
  }
  return String(valor).trim();
}

function numeroSeguroTema_(valor) {
  const numero = Number(valor);
  return isFinite(numero) && numero > 0 ? numero : 0;
}

function opcionesCrudTemas(usuario) {
  return {
    campoId: 'id',
    campoActivo: 'activo',
    campoFechaRegistro: 'fechaRegistro',
    campoFechaActualizacion: 'fechaActualizacion',
    campoActualizadoPor: 'actualizadoPor',
    usuario: usuario || '',
    valorActivo: 'Sí',
    valorInactivo: 'No'
  };
}

function auditarTema_(sesion, accion, id, detalle) {
  registrarAuditoria({
    usuario: sesion.usuario,
    nombre: sesion.nombre,
    accion: accion,
    entidad: 'Temas',
    idRegistro: id,
    detalle: JSON.stringify(detalle || {})
  });
}


function obtenerDocumentosTemasRF08_() {
  try {
    return leerHojaComoObjetos(HOJAS.DOCUMENTOS).filter(function(item) {
      return convertirBooleano(item.activo);
    }).map(function(item) {
      return { id: item.id || '', nombre: item.nombre || '', categoria: item.categoria || '', url: item.archivoDriveUrl || '' };
    }).filter(function(item) { return item.id && item.nombre; });
  } catch (error) { return []; }
}

function actualizarPreferenciasMultimediaTema(token, temaId, datos) {
  const sesion = obtenerSesion(token);
  const tema = validarTemaPerteneceASesion_(sesion, temaId);
  const cambios = {};
  if (datos && datos.usaCancionEstandar !== undefined) cambios.usaCancionEstandar = convertirBooleano(datos.usaCancionEstandar) ? 'Sí' : 'No';
  if (datos && datos.usaVideoEstandar !== undefined) cambios.usaVideoEstandar = convertirBooleano(datos.usaVideoEstandar) ? 'Sí' : 'No';
  actualizarRegistroSheet(HOJAS.TEMAS, tema.id, cambios, opcionesCrudTemas(sesion.usuario));
  return convertirTema(leerRegistroPorIdSheet(HOJAS.TEMAS, tema.id, opcionesCrudTemas('')));
}

function cambiarEstadoPalancaTema(token, temaId, estado) {
  const sesion = obtenerSesion(token);
  if (!tienePermisoSesion_(sesion, 'TEMAS_GESTIONAR_PALANCAS') && !tienePermisoSesion_(sesion, 'PALANCAS_APROBAR_LOGISTICA')) {
    throw crearErrorAplicacion('PERMISO_DENEGADO', 'No tiene permisos para gestionar palancas.');
  }
  const permitidos = ['Pendiente','Solicitada','Entregada','Empaquetada','Entregada a Logística'];
  const nuevo = String(estado || '').trim();
  if (permitidos.indexOf(nuevo) < 0) throw crearErrorAplicacion('ESTADO_PALANCA_INVALIDO', 'El estado de la palanca no es válido.');
  const tema = leerRegistroPorIdSheet(HOJAS.TEMAS, temaId, opcionesCrudTemas(''));
  if (!tema || !convertirBooleano(tema.requierePalanca)) throw crearErrorAplicacion('TEMA_SIN_PALANCA', 'El tema no requiere palanca.');
  return convertirTema(actualizarRegistroSheet(HOJAS.TEMAS, temaId, { palancaEstado: nuevo, palancaAprobadaLogisticaPor: '', palancaFechaAprobacionLogistica: '' }, opcionesCrudTemas(sesion.usuario)));
}

function aprobarPalancaLogistica(token, temaId) {
  const sesion = validarPermiso(token, 'PALANCAS_APROBAR_LOGISTICA');
  const tema = leerRegistroPorIdSheet(HOJAS.TEMAS, temaId, opcionesCrudTemas(''));
  if (String(tema.palancaEstado || '') !== 'Entregada a Logística') throw crearErrorAplicacion('PALANCA_NO_ENTREGADA_LOGISTICA', 'La palanca aún no está entregada a Logística.');
  return convertirTema(actualizarRegistroSheet(HOJAS.TEMAS, temaId, { palancaAprobadaLogisticaPor: sesion.nombre || sesion.usuario, palancaFechaAprobacionLogistica: new Date() }, opcionesCrudTemas(sesion.usuario)));
}

function tienePermisoSesion_(sesion, permiso) {
  try { validarPermiso(sesion.token || '', permiso); return true; } catch (e) {}
  try { return (sesion.permisos || []).indexOf(permiso) >= 0; } catch (e2) { return false; }
}
